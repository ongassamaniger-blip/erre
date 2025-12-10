import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { User, ArrowDown, Tree, FileArrowDown, Pencil } from '@phosphor-icons/react'
import type { BranchUserHierarchy, BranchUser } from '@/types/branchUserManagement'
import { exportHierarchyToPDF } from '@/utils/userExport'
import { HierarchyEditDialog } from './HierarchyEditDialog'

interface HierarchyViewProps {
  hierarchy: BranchUserHierarchy[]
  users: BranchUser[]
  facilityName?: string
  onUpdate?: () => void
}

export function HierarchyView({ hierarchy, users, facilityName, onUpdate }: HierarchyViewProps) {
  const [editingUser, setEditingUser] = useState<BranchUser | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const handleEditUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      setEditingUser(user)
      setEditDialogOpen(true)
    }
  }

  const handleUpdateSuccess = () => {
    if (onUpdate) onUpdate()
  }
  const getRoleColor = (role: string) => {
    if (role.includes('Manager')) return 'bg-blue-500/10 text-blue-700 border-blue-200'
    if (role === 'Accountant' || role === 'HR Specialist' || role === 'Project Coordinator') return 'bg-purple-500/10 text-purple-700 border-purple-200'
    if (role === 'Staff') return 'bg-green-500/10 text-green-700 border-green-200'
    return 'bg-gray-500/10 text-gray-700 border-gray-200'
  }

  const renderHierarchy = (node: BranchUserHierarchy, level: number = 0) => {
    const user = users.find(u => u.id === node.userId)
    const indent = level * 24

    return (
      <div key={node.userId} className="space-y-2">
        <div
          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors group"
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{node.userName}</div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={getRoleColor(node.role)}>
                {node.role}
              </Badge>
              {user?.department && (
                <span className="text-xs text-muted-foreground">{user.department}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {level > 0 && (
              <ArrowDown size={16} className="text-muted-foreground rotate-[-90deg]" />
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleEditUser(node.userId)}
              title="Hiyerarşi Düzenle"
            >
              <Pencil size={16} />
            </Button>
          </div>
        </div>

        {node.subordinates.length > 0 && (
          <div className="space-y-2">
            {node.subordinates.map(subordinate =>
              renderHierarchy(subordinate, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  if (hierarchy.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Hiyerarşi bulunamadı. Kullanıcılar için üst yönetici atayın.
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTotalUsers = (node: BranchUserHierarchy): number => {
    return 1 + node.subordinates.reduce((sum, sub) => sum + getTotalUsers(sub), 0)
  }

  const totalUsers = hierarchy.reduce((sum, node) => sum + getTotalUsers(node), 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organizasyon Hiyerarşisi</CardTitle>
              <CardDescription>
                {totalUsers} kullanıcı • {hierarchy.length} yönetici
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportHierarchyToPDF(hierarchy, users, facilityName)}
              className="gap-2"
            >
              <FileArrowDown size={16} />
              PDF İndir
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {hierarchy.map(node => renderHierarchy(node, 0))}
          </div>
        </CardContent>
      </Card>

      <HierarchyEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        user={editingUser}
        allUsers={users}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  )
}

