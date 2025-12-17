import { supabase } from '@/lib/supabase'
import type { Project, Task, Milestone, ProjectTeamMember, ProjectActivity } from '@/types'

export const projectService = {
  async getProjects(facilityId?: string, isDeleted = false): Promise<Project[]> {
    try {
      // Optimize: Only select needed columns instead of *
      let query = supabase.from('projects').select(`
        id,
        facility_id,
        name,
        description,
        status,
        priority,
        start_date,
        end_date,
        budget,
        spent_budget,
        manager_id,
        category_id,
        type_id,
        progress,
        total_tasks,
        completed_tasks,
        total_team_members,
        tags,
        is_deleted,
        created_at,
        updated_at
      `)

      if (facilityId) {
        query = query.eq('facility_id', facilityId)
      }

      // Filter by is_deleted status
      query = query.eq('is_deleted', isDeleted)

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Fetch dynamic stats for all projects
      const projects = (data || []).map(fromDbProject)

      // Get all project IDs
      const projectIds = projects.map(p => p.id)

      if (projectIds.length === 0) return projects

      // Fetch task counts for all projects
      const { data: allTasks } = await supabase
        .from('project_tasks')
        .select('project_id, status')
        .in('project_id', projectIds)

      // Fetch team member counts for all projects
      const { data: allTeamMembers } = await supabase
        .from('project_team_members')
        .select('project_id')
        .in('project_id', projectIds)

      // Fetch project expenses from transactions
      const { data: projectExpenses } = await supabase
        .from('transactions')
        .select('project_id, amount')
        .eq('type', 'expense')
        .eq('status', 'approved')
        .in('project_id', projectIds)

      // Calculate stats per project
      const taskGroups = new Map<string, { total: number; completed: number }>()
      const teamCounts = new Map<string, number>()
      const spentAmounts = new Map<string, number>()

      allTasks?.forEach(task => {
        const current = taskGroups.get(task.project_id) || { total: 0, completed: 0 }
        current.total++
        if (task.status === 'completed') current.completed++
        taskGroups.set(task.project_id, current)
      })

      allTeamMembers?.forEach(member => {
        const count = teamCounts.get(member.project_id) || 0
        teamCounts.set(member.project_id, count + 1)
      })

      projectExpenses?.forEach(expense => {
        if (expense.project_id) {
          const current = spentAmounts.get(expense.project_id) || 0
          spentAmounts.set(expense.project_id, current + expense.amount)
        }
      })

      // Calculate progress and assign stats to each project
      return projects.map(project => {
        const tasks = taskGroups.get(project.id) || { total: 0, completed: 0 }
        const teamSize = teamCounts.get(project.id) || 0
        const spent = spentAmounts.get(project.id) || 0

        // Progress based on completed tasks / total tasks
        const progress = tasks.total > 0
          ? Math.round((tasks.completed / tasks.total) * 100)
          : 0

        return {
          ...project,
          taskCount: tasks.total,
          completedTasks: tasks.completed,
          teamSize,
          spent,
          progress
        }
      })
    } catch (error) {
      console.error('Get projects error:', error)
      return []
    }
  },

  async getProjectById(id: string): Promise<Project | null> {
    try {
      // Optimize: Only select needed columns
      const { data, error } = await supabase
        .from('projects')
        .select(`
          id,
          facility_id,
          name,
          description,
          status,
          priority,
          start_date,
          end_date,
          budget,
          spent_budget,
          manager_id,
          category_id,
          type_id,
          progress,
          total_tasks,
          completed_tasks,
          total_team_members,
          tags,
          is_deleted,
          created_at,
          updated_at
        `)
        .eq('id', id)
        .single()

      if (error) throw error

      // Fetch dynamic stats
      const { count: taskCount } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)

      const { count: completedTasks } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .eq('status', 'completed')

      const today = new Date().toISOString().split('T')[0]
      const { count: overdueTasks } = await supabase
        .from('project_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)
        .lt('due_date', today)
        .neq('status', 'completed')

      const { count: teamSize } = await supabase
        .from('project_team_members')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id)

      const project = fromDbProject(data)
      return {
        ...project,
        taskCount: taskCount || 0,
        completedTasks: completedTasks || 0,
        overdueTasks: overdueTasks || 0,
        teamSize: teamSize || 0,
      }
    } catch (error) {
      console.error('Get project error:', error)
      return null
    }
  },

  async createProject(projectData: Partial<Project>): Promise<Project> {
    try {
      // Generate a project code if not provided
      const projectCode = projectData.code || `PRJ-${Date.now().toString().slice(-6)}`

      const dbData = toDbProject({ ...projectData, code: projectCode })
      const { data, error } = await supabase
        .from('projects')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return fromDbProject(data)
    } catch (error) {
      console.error('Create project error:', error)
      throw error
    }
  },

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    try {
      // Get old project to compare status
      const { data: oldProject } = await supabase
        .from('projects')
        .select('status')
        .eq('id', id)
        .single()

      const dbData = toDbProject(updates)
      const { data, error } = await supabase
        .from('projects')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      const updatedProject = fromDbProject(data)

      // Log activity
      if (oldProject && updates.status && updates.status !== oldProject.status) {
        const statusLabels: Record<string, string> = {
          'planning': 'Planlama',
          'active': 'Aktif',
          'on-hold': 'Beklemede',
          'completed': 'Tamamlandı',
          'cancelled': 'İptal Edildi'
        }
        const oldStatus = statusLabels[oldProject.status] || oldProject.status
        const newStatus = statusLabels[updatedProject.status] || updatedProject.status

        await this.logActivity(
          updatedProject.id,
          'status_changed',
          `Proje durumu "${oldStatus}" -> "${newStatus}" olarak değiştirildi`
        )
      } else if (Object.keys(updates).length > 0) {
        await this.logActivity(
          updatedProject.id,
          'project_updated',
          'Proje bilgileri güncellendi'
        )
      }

      return updatedProject
    } catch (error) {
      console.error('Update project error:', error)
      throw error
    }
  },

  async deleteProject(id: string): Promise<void> {
    try {
      // Soft delete (Quarantine)
      const { error } = await supabase
        .from('projects')
        .update({ is_deleted: true })
        .eq('id', id)

      if (error) throw error

      // Log activity
      await this.logActivity(
        id,
        'status_changed',
        'Proje karantinaya alındı (Silindi)'
      )
    } catch (error) {
      console.error('Delete project error:', error)
      throw error
    }
  },

  async restoreProject(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_deleted: false })
        .eq('id', id)

      if (error) throw error

      await this.logActivity(
        id,
        'status_changed',
        'Proje karantinadan çıkarıldı (Geri yüklendi)'
      )
    } catch (error) {
      console.error('Restore project error:', error)
      throw error
    }
  },

  // Tasks
  async getTasks(projectId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(fromDbTask)
    } catch (error) {
      console.error('Get tasks error:', error)
      return []
    }
  },

  async createTask(task: Partial<Task>): Promise<Task> {
    try {
      const dbData = toDbTask(task)
      const { data, error } = await supabase
        .from('project_tasks')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      const createdTask = fromDbTask(data)

      // Log activity
      await this.logActivity(
        createdTask.projectId,
        'task_created',
        `"${createdTask.name}" görevi oluşturuldu`
      )

      return createdTask
    } catch (error) {
      console.error('Create task error:', error)
      throw error
    }
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    try {
      // Get old task to compare status
      const { data: oldTask } = await supabase
        .from('project_tasks')
        .select('status, name, project_id')
        .eq('id', id)
        .single()

      const dbData = toDbTask(updates)
      const { data, error } = await supabase
        .from('project_tasks')
        .update(dbData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedTask = fromDbTask(data)

      // Log status change
      if (oldTask && updates.status && updates.status !== oldTask.status) {
        const statusLabels: Record<string, string> = {
          'todo': 'Yapılacak',
          'in-progress': 'Devam Ediyor',
          'review': 'İnceleme',
          'completed': 'Tamamlandı'
        }

        const oldStatus = statusLabels[oldTask.status] || oldTask.status
        const newStatus = statusLabels[updates.status] || updates.status

        await this.logActivity(
          updatedTask.projectId,
          updates.status === 'completed' ? 'task_completed' : 'status_changed',
          `"${updatedTask.name}" görevi "${oldStatus}" durumundan "${newStatus}" durumuna taşındı`
        )
      }

      return updatedTask
    } catch (error) {
      console.error('Update task error:', error)
      throw error
    }
  },

  async deleteTask(id: string): Promise<void> {
    try {
      // Get task details for logging
      const { data: task } = await supabase
        .from('project_tasks')
        .select('name, project_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('project_tasks')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (task) {
        await this.logActivity(
          task.project_id,
          'task_deleted',
          `"${task.name}" görevi silindi`
        )
      }
    } catch (error) {
      console.error('Delete task error:', error)
      throw error
    }
  },

  // Milestones
  async getMilestones(projectId: string): Promise<Milestone[]> {
    try {
      const { data, error } = await supabase
        .from('project_milestones')
        .select('*')
        .eq('project_id', projectId)
        .order('target_date', { ascending: true })

      if (error) throw error
      return (data || []).map(fromDbMilestone)
    } catch (error) {
      console.error('Get milestones error:', error)
      return []
    }
  },

  async createMilestone(milestone: Partial<Milestone>): Promise<Milestone> {
    try {
      const dbData = toDbMilestone(milestone)
      const { data, error } = await supabase
        .from('project_milestones')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      const createdMilestone = fromDbMilestone(data)

      // Log activity
      await this.logActivity(
        createdMilestone.projectId,
        'status_changed',
        `"${createdMilestone.name}" kilometre taşı oluşturuldu`
      )

      return createdMilestone
    } catch (error) {
      console.error('Create milestone error:', error)
      throw error
    }
  },

  async deleteMilestone(id: string): Promise<void> {
    try {
      // Get milestone details for logging before delete
      const { data: milestone } = await supabase
        .from('project_milestones')
        .select('name, project_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('project_milestones')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (milestone) {
        await this.logActivity(
          milestone.project_id,
          'status_changed',
          `"${milestone.name}" kilometre taşı silindi`
        )
      }
    } catch (error) {
      console.error('Delete milestone error:', error)
      throw error
    }
  },

  // Team Members
  async getTeamMembers(projectId: string): Promise<ProjectTeamMember[]> {
    try {
      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId)

      if (error) throw error
      return (data || []).map(fromDbTeamMember)
    } catch (error) {
      console.error('Get team members error:', error)
      return []
    }
  },

  async addTeamMember(member: Partial<ProjectTeamMember>): Promise<ProjectTeamMember> {
    try {
      const dbData = toDbTeamMember(member)
      const { data, error } = await supabase
        .from('project_team_members')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error

      const newMember = fromDbTeamMember(data)

      await this.logActivity(
        newMember.projectId,
        'member_added',
        `"${newMember.employeeName}" takıma eklendi`
      )

      return newMember
    } catch (error) {
      console.error('Add team member error:', error)
      throw error
    }
  },

  async removeTeamMember(id: string): Promise<void> {
    try {
      // Get member details
      const { data: member } = await supabase
        .from('project_team_members')
        .select('employee_name, project_id')
        .eq('id', id)
        .single()

      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .eq('id', id)

      if (error) throw error

      if (member) {
        await this.logActivity(
          member.project_id,
          'member_removed',
          `"${member.employee_name}" takımdan çıkarıldı`
        )
      }
    } catch (error) {
      console.error('Remove team member error:', error)
      throw error
    }
  },

  // Activities
  async getActivities(projectId: string): Promise<ProjectActivity[]> {
    try {
      const { data, error } = await supabase
        .from('project_activities')
        .select('*')
        .eq('project_id', projectId)
        .order('timestamp', { ascending: false })
        .limit(20)

      if (error) throw error
      return (data || []).map(fromDbActivity)
    } catch (error) {
      console.error('Get activities error:', error)
      return []
    }
  },

  async logActivity(projectId: string, type: ProjectActivity['type'], description: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get project manager name
      const { data: project } = await supabase
        .from('projects')
        .select('manager_name')
        .eq('id', projectId)
        .single()

      // Get user profile for fallback
      const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

      const actorName = project?.manager_name || profile?.name || user.email

      await supabase.from('project_activities').insert({
        project_id: projectId,
        type,
        description,
        user_id: user.id,
        user_name: actorName,
      })
    } catch (error) {
      console.error('Log activity error:', error)
    }
  }
}

// Helper functions for data mapping
const toDbProject = (project: Partial<Project>) => {
  const dbData: any = { ...project }

  if (project.managerId) dbData.manager_id = project.managerId
  if (project.managerName) dbData.manager_name = project.managerName
  if (project.facilityId) dbData.facility_id = project.facilityId
  if (project.startDate) dbData.start_date = project.startDate
  if (project.endDate) dbData.end_date = project.endDate
  if (project.teamSize) dbData.team_size = project.teamSize
  if (project.taskCount) dbData.task_count = project.taskCount
  if (project.completedTasks) dbData.completed_tasks = project.completedTasks
  if (project.overdueTasks) dbData.overdue_tasks = project.overdueTasks
  if (project.typeId) dbData.type_id = project.typeId
  if (project.categoryId) dbData.category_id = project.categoryId

  // Remove camelCase keys that are not in DB
  delete dbData.managerId
  delete dbData.facilityId
  delete dbData.startDate
  delete dbData.endDate
  delete dbData.teamSize
  delete dbData.taskCount
  delete dbData.completedTasks
  delete dbData.overdueTasks
  delete dbData.managerName
  delete dbData.typeId
  delete dbData.categoryId
  // type and category (names) might be passed but we don't save them to DB columns if they don't exist
  // Assuming DB only has type_id and category_id. 
  // If DB has type/category text columns, we can keep them. 
  // Schema shows only IDs. So we should delete names if they are present to avoid error.
  delete dbData.type
  delete dbData.category

  return dbData
}

const fromDbProject = (dbData: any): Project => {
  return {
    ...dbData,
    managerId: dbData.manager_id,
    facilityId: dbData.facility_id,
    startDate: dbData.start_date,
    endDate: dbData.end_date,
    teamSize: dbData.team_size || 0,
    taskCount: dbData.task_count || 0,
    completedTasks: dbData.completed_tasks || 0,
    overdueTasks: dbData.overdue_tasks || 0,
    managerName: dbData.manager_name || '',
    status: dbData.status || 'planning',
    progress: dbData.progress || 0,
    budget: dbData.budget || 0,
    spent: dbData.spent || 0,
    collected: dbData.collected || 0,
    currency: dbData.currency || 'TRY',
    isDeleted: dbData.is_deleted || false,
    typeId: dbData.type_id,
    categoryId: dbData.category_id,
    // We might want to fetch names via join, but for now just IDs
  }
}

const toDbTask = (task: Partial<Task>) => {
  const dbData: any = { ...task }
  if (task.projectId) dbData.project_id = task.projectId
  if (task.assigneeId) dbData.assignee_id = task.assigneeId
  if (task.assigneeName) dbData.assignee_name = task.assigneeName
  if (task.startDate) dbData.start_date = task.startDate
  if (task.dueDate) dbData.due_date = task.dueDate

  delete dbData.projectId
  delete dbData.assigneeId
  delete dbData.assigneeName
  delete dbData.startDate
  delete dbData.dueDate

  return dbData
}

const fromDbTask = (dbData: any): Task => {
  return {
    ...dbData,
    projectId: dbData.project_id,
    assigneeId: dbData.assignee_id,
    assigneeName: dbData.assignee_name,
    startDate: dbData.start_date,
    dueDate: dbData.due_date,
  }
}

const toDbMilestone = (milestone: Partial<Milestone>) => {
  const dbData: any = { ...milestone }
  if (milestone.projectId) dbData.project_id = milestone.projectId
  if (milestone.targetDate) dbData.target_date = milestone.targetDate
  if (milestone.completedDate) dbData.completed_date = milestone.completedDate

  delete dbData.projectId
  delete dbData.targetDate
  delete dbData.completedDate

  return dbData
}

const fromDbMilestone = (dbData: any): Milestone => {
  return {
    ...dbData,
    projectId: dbData.project_id,
    targetDate: dbData.target_date,
    completedDate: dbData.completed_date,
  }
}

const toDbTeamMember = (member: Partial<ProjectTeamMember>) => {
  const dbData: any = { ...member }
  if (member.projectId) dbData.project_id = member.projectId
  if (member.employeeId) dbData.employee_id = member.employeeId
  if (member.employeeName) dbData.employee_name = member.employeeName

  delete dbData.projectId
  delete dbData.employeeId
  delete dbData.employeeName

  return dbData
}

const fromDbTeamMember = (dbData: any): ProjectTeamMember => {
  return {
    ...dbData,
    projectId: dbData.project_id,
    employeeId: dbData.employee_id,
    employeeName: dbData.employee_name,
  }
}

const fromDbActivity = (dbData: any): ProjectActivity => {
  return {
    ...dbData,
    projectId: dbData.project_id,
    userId: dbData.user_id,
    userName: dbData.user_name,
  }
}
