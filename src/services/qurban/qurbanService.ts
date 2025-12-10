import { supabase } from '@/lib/supabase'
import type { QurbanCampaign, QurbanDonation, QurbanSchedule, DistributionRecord } from '@/types'

export const campaignService = {
  // Helper to map DB result to App type
  mapToCampaign(data: any): QurbanCampaign {
    return {
      ...data,
      targetAmount: data.target_amount,
      collectedAmount: data.collected_amount,
      targetAnimals: data.target_animals,
      completedAnimals: data.completed_animals,
      startDate: data.start_date,
      endDate: data.end_date,
      slaughterStartDate: data.slaughter_start_date,
      slaughterEndDate: data.slaughter_end_date,
      facilityId: data.facility_id,
      campaignType: data.campaign_type,
    }
  },

  // Helper to map App data to DB format
  mapToDbCampaign(data: Partial<QurbanCampaign>): any {
    const dbData: any = { ...data }
    if ('targetAmount' in data) dbData.target_amount = data.targetAmount
    if ('collectedAmount' in data) dbData.collected_amount = data.collectedAmount
    if ('targetAnimals' in data) dbData.target_animals = data.targetAnimals
    if ('completedAnimals' in data) dbData.completed_animals = data.completedAnimals
    if ('startDate' in data) dbData.start_date = data.startDate
    if ('endDate' in data) dbData.end_date = data.endDate
    if ('slaughterStartDate' in data) dbData.slaughter_start_date = data.slaughterStartDate
    if ('slaughterEndDate' in data) dbData.slaughter_end_date = data.slaughterEndDate
    if ('facilityId' in data) dbData.facility_id = data.facilityId
    if ('campaignType' in data) dbData.campaign_type = data.campaignType

    // Remove camelCase keys
    delete dbData.targetAmount
    delete dbData.collectedAmount
    delete dbData.targetAnimals
    delete dbData.completedAnimals
    delete dbData.startDate
    delete dbData.endDate
    delete dbData.slaughterStartDate
    delete dbData.slaughterEndDate
    delete dbData.facilityId
    delete dbData.campaignType

    return dbData
  },

  async getCampaigns(filters?: { year?: number; status?: string; facilityId?: string }): Promise<QurbanCampaign[]> {
    try {
      let query = supabase.from('qurban_campaigns').select('*')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.year) {
        query = query.eq('year', filters.year)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('year', { ascending: false })

      if (error) throw error
      return (data || []).map(this.mapToCampaign)
    } catch (error) {
      console.error('Get campaigns error:', error)
      return []
    }
  },
  async getCampaignById(id: string): Promise<QurbanCampaign | null> {
    try {
      const { data, error } = await supabase
        .from('qurban_campaigns')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data ? this.mapToCampaign(data) : null
    } catch (error) {
      console.error('Get campaign by id error:', error)
      return null
    }
  },

  async createCampaign(campaignData: Partial<QurbanCampaign>): Promise<QurbanCampaign> {
    try {
      const dbData = this.mapToDbCampaign(campaignData)
      const { data, error } = await supabase
        .from('qurban_campaigns')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return this.mapToCampaign(data)
    } catch (error) {
      console.error('Create campaign error:', error)
      throw error
    }
  },

  async updateCampaign(id: string, updates: Partial<QurbanCampaign>): Promise<QurbanCampaign> {
    try {
      const dbUpdates = this.mapToDbCampaign(updates)
      const { data, error } = await supabase
        .from('qurban_campaigns')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return this.mapToCampaign(data)
    } catch (error) {
      console.error('Update campaign error:', error)
      throw error
    }
  },

  async deleteCampaign(id: string): Promise<void> {
    try {
      // Check for existing donations
      const { count, error: countError } = await supabase
        .from('qurban_donations')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', id)

      if (countError) throw countError

      if (count && count > 0) {
        throw new Error('Bu kampanyaya ait bağışlar bulunduğu için silinemez.')
      }

      const { error } = await supabase
        .from('qurban_campaigns')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete campaign error:', error)
      throw error
    }
  },

  async approveCampaign(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('qurban_campaigns')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Approve campaign error:', error)
      throw error
    }
  },

  async rejectCampaign(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('qurban_campaigns')
        .update({ status: 'rejected' })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Reject campaign error:', error)
      throw error
    }
  }
}

export const donationService = {
  // Helper to map DB result to App type
  mapToDonation(data: any): QurbanDonation {
    return {
      ...data,
      campaignId: data.campaign_id,
      campaignName: data.campaign_name || '', // This might need a join to fetch
      donorName: data.donor_name,
      donorPhone: data.donor_phone,
      donorEmail: data.donor_email,
      donorCountry: data.donor_country,
      qurbanType: data.qurban_type,
      shareCount: data.share_count,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      distributionRegion: data.distribution_region,
      deliveryAddress: data.delivery_address,
      hasProxy: data.has_proxy,
      proxyText: data.proxy_text,
      specialRequests: data.special_requests,
      createdDate: data.created_at,
      facilityId: data.facility_id,
      exchangeRate: data.exchange_rate,
      amountInTry: data.amount_in_try,
    }
  },

  // Helper to map App data to DB format
  mapToDbDonation(data: Partial<QurbanDonation>): any {
    const dbData: any = {}

    // Explicitly map only known DB columns
    if ('campaignId' in data) dbData.campaign_id = data.campaignId
    if ('donorName' in data) dbData.donor_name = data.donorName
    if ('donorPhone' in data) dbData.donor_phone = data.donorPhone
    if ('donorEmail' in data) dbData.donor_email = data.donorEmail
    if ('donorCountry' in data) dbData.donor_country = data.donorCountry
    if ('qurbanType' in data) dbData.qurban_type = data.qurbanType
    if ('shareCount' in data) dbData.share_count = data.shareCount
    if ('amount' in data) dbData.amount = data.amount
    if ('currency' in data) dbData.currency = data.currency
    if ('paymentMethod' in data) dbData.payment_method = data.paymentMethod
    if ('paymentStatus' in data) dbData.payment_status = data.paymentStatus
    if ('distributionRegion' in data) dbData.distribution_region = data.distributionRegion
    if ('deliveryAddress' in data) dbData.delivery_address = data.deliveryAddress
    if ('hasProxy' in data) dbData.has_proxy = data.hasProxy
    if ('proxyText' in data) dbData.proxy_text = data.proxyText
    if ('specialRequests' in data) dbData.special_requests = data.specialRequests
    if ('facilityId' in data) dbData.facility_id = data.facilityId
    if ('exchangeRate' in data) dbData.exchange_rate = data.exchangeRate
    if ('amountInTry' in data) dbData.amount_in_try = data.amountInTry

    // Note: 'status' and 'campaignName' are not mapped as they might not exist in DB or are derived

    if (data.campaignName) dbData.campaign_name = data.campaignName

    return dbData
  },
  async getDonations(filters?: { campaignId?: string; facilityId?: string }): Promise<QurbanDonation[]> {
    try {
      let query = supabase.from('qurban_donations').select('*')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.campaignId) {
        query = query.eq('campaign_id', filters.campaignId)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(this.mapToDonation)
    } catch (error) {
      console.error('Get donations error:', error)
      return []
    }
  },

  async createDonation(donationData: Partial<QurbanDonation>): Promise<QurbanDonation> {
    try {
      // Check if campaign is active
      if (donationData.campaignId) {
        console.log('Checking campaign status for:', donationData.campaignId)
        const campaign = await campaignService.getCampaignById(donationData.campaignId)
        console.log('Campaign found:', campaign)

        if (!campaign) {
          console.error('Campaign not found for ID:', donationData.campaignId)
          throw new Error('Kampanya bulunamadı')
        }
        if (campaign.status !== 'active') {
          console.error('Campaign status is not active:', campaign.status)
          throw new Error(`Sadece aktif kampanyalara bağış yapılabilir. Kampanya durumu: ${campaign.status}`)
        }

        // Ensure campaign name is set
        donationData.campaignName = campaign.name
      }

      const dbData = this.mapToDbDonation(donationData)
      const { data, error } = await supabase
        .from('qurban_donations')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      const donation = this.mapToDonation(data)

      // Only process paid donations
      if (donation.paymentStatus === 'paid') {
        // Create transaction for income
        await this.createDonationTransaction(donation)

        // Update campaign collected amount (using TRY equivalent)
        if (donation.campaignId) {
          await this.updateCampaignCollectedAmount(donation.campaignId)
        }
      }

      return donation
    } catch (error) {
      console.error('Create donation error:', error)
      throw error
    }
  },

  // Update campaign's collected amount based on paid donations
  async updateCampaignCollectedAmount(campaignId: string): Promise<void> {
    try {
      // Get all paid donations for this campaign
      const { data: donations, error: donationsError } = await supabase
        .from('qurban_donations')
        .select('amount, currency, exchange_rate, amount_in_try, share_count')
        .eq('campaign_id', campaignId)
        .eq('payment_status', 'paid')

      if (donationsError) throw donationsError

      // Calculate total in TRY and total shares
      const stats = (donations || []).reduce((acc, d) => {
        // Calculate amount in TRY
        let amountInTry = 0
        if (d.amount_in_try) {
          amountInTry = d.amount_in_try
        } else {
          // Fallback
          const amount = d.amount || 0
          const rate = d.exchange_rate || 1
          amountInTry = d.currency === 'TRY' ? amount : amount * rate
        }

        return {
          totalAmount: acc.totalAmount + amountInTry,
          totalShares: acc.totalShares + (d.share_count || 0)
        }
      }, { totalAmount: 0, totalShares: 0 })

      // Get campaign details
      const { data: campaign, error: campaignError } = await supabase
        .from('qurban_campaigns')
        .select('target_amount, status, campaign_type')
        .eq('id', campaignId)
        .single()

      if (campaignError) throw campaignError

      // Determine divisor for animal count based on campaign type
      // large_cattle: 7 shares = 1 animal
      // small_cattle: 1 share = 1 animal
      const data = campaign as any // Cast to handle potential type mismatches with raw DB response
      const isLargeCattle = data.campaign_type === 'large_cattle'
      const divisor = isLargeCattle ? 7 : 1

      const completedAnimals = Math.floor(stats.totalShares / divisor)

      // Determine if campaign should be marked as completed
      const shouldComplete = campaign &&
        campaign.status === 'active' &&
        stats.totalAmount >= (campaign.target_amount || 0)

      // Update campaign
      const updateData: any = {
        collected_amount: stats.totalAmount,
        completed_animals: completedAnimals
      }

      if (shouldComplete) {
        updateData.status = 'completed'
        console.log(`Campaign ${campaignId} reached target! Marking as completed.`)
      }

      const { error: updateError } = await supabase
        .from('qurban_campaigns')
        .update(updateData)
        .eq('id', campaignId)

      if (updateError) throw updateError

      console.log(`Campaign ${campaignId} updated: Amount=${stats.totalAmount}, Animals=${completedAnimals}`)
    } catch (error) {
      console.error('Update campaign collected amount error:', error)
      // Don't throw to avoid blocking main flow
    }
  },

  async getCampaignDonors(campaignId: string): Promise<QurbanDonation[]> {
    try {
      const { data, error } = await supabase
        .from('qurban_donations')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('payment_status', 'paid')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(this.mapToDonation)
    } catch (error) {
      console.error('Get campaign donors error:', error)
      return []
    }
  },

  async updateDonation(id: string, updates: Partial<QurbanDonation>): Promise<QurbanDonation> {
    try {
      // Get current donation to check status change
      const { data: currentDonation, error: fetchError } = await supabase
        .from('qurban_donations')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      const dbUpdates = this.mapToDbDonation(updates)
      const { data, error } = await supabase
        .from('qurban_donations')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const updatedDonation = this.mapToDonation(data)

      // Check if status changed to paid
      if (currentDonation.payment_status !== 'paid' && updatedDonation.paymentStatus === 'paid') {
        await this.createDonationTransaction(updatedDonation)

        // Update campaign collected amount
        if (updatedDonation.campaignId) {
          await this.updateCampaignCollectedAmount(updatedDonation.campaignId)
        }
      }

      return updatedDonation
    } catch (error) {
      console.error('Update donation error:', error)
      throw error
    }
  },

  async createDonationTransaction(donation: QurbanDonation) {
    try {
      // 1. Get or create 'Kurban Bağışları' category using centralized helper
      const { categoryService } = await import('@/services/finance/categoryService')
      const categoryId = await categoryService.getOrCreateSystemCategory('Kurban Bağışları', 'income')

      if (!categoryId) {
        console.error('Failed to get or create Kurban Bağışları category')
        return
      }

      // 2. Create transaction
      const { transactionService } = await import('@/services/finance/transactionService')

      // Check if transaction already exists for this donation
      const transactionCode = `DON-${donation.id.substring(0, 8).toUpperCase()}`

      const existing = await transactionService.getAllTransactions({ search: transactionCode })
      if (existing.length > 0) {
        console.log('Transaction already exists for donation:', donation.id)
        return
      }

      await transactionService.createTransaction({
        type: 'income',
        categoryId: categoryId,
        amount: donation.amount,
        currency: (donation.currency as any) || 'TRY',
        exchangeRate: donation.exchangeRate,
        amountInBaseCurrency: donation.amountInTry,
        date: new Date().toISOString().split('T')[0],
        title: `Kurban Bağışı - ${donation.donorName}`,
        description: `${donation.campaignName || 'Genel'} kampanyası için ${donation.shareCount} hisse bağışı.`,
        facilityId: donation.facilityId || '',
        status: 'approved',
        paymentMethod: (donation.paymentMethod as any) || 'bank_transfer',
        documents: [],
        transactionNumber: transactionCode,
        vendorCustomerId: undefined
      })

    } catch (error) {
      console.error('Failed to create donation transaction:', error)
      // Don't throw to avoid blocking the main donation flow
    }
  },

  async checkEmailAvailability(email: string): Promise<{ isEmployee: boolean, isDonor: boolean }> {
    try {
      // Check if email exists in employees
      const { data: employeeData } = await supabase
        .from('employees')
        .select('id')
        .eq('email', email)
        .single()

      // Check if email exists in qurban_donations (as a previous donor)
      const { data: donorData } = await supabase
        .from('qurban_donations')
        .select('id')
        .eq('donor_email', email)
        .limit(1)

      return {
        isEmployee: !!employeeData,
        isDonor: !!donorData && donorData.length > 0
      }
    } catch (error) {
      console.error('Check email availability error:', error)
      return { isEmployee: false, isDonor: false }
    }
  },

  async deleteDonation(id: string): Promise<void> {
    try {
      // 1. Get donation details before deletion to update campaign
      const { data: donation, error: fetchError } = await supabase
        .from('qurban_donations')
        .select('campaign_id, payment_status')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // 2. Delete the donation
      const { error } = await supabase
        .from('qurban_donations')
        .delete()
        .eq('id', id)

      if (error) throw error

      // 3. Update campaign collected amount if donation was paid
      if (donation?.campaign_id && donation?.payment_status === 'paid') {
        await this.updateCampaignCollectedAmount(donation.campaign_id)
      }
    } catch (error) {
      console.error('Delete donation error:', error)
      throw error
    }
  }
}

export const scheduleService = {
  // Helper to map DB result to App type
  mapToSchedule(data: any): QurbanSchedule {
    const now = new Date()
    const scheduleDate = new Date(data.date)
    const [startHour, startMinute] = data.start_time.split(':').map(Number)
    const [endHour, endMinute] = data.end_time.split(':').map(Number)

    const startDate = new Date(scheduleDate)
    startDate.setHours(startHour, startMinute, 0)

    const endDate = new Date(scheduleDate)
    endDate.setHours(endHour, endMinute, 0)

    let status: 'scheduled' | 'in-progress' | 'completed' = 'scheduled'

    if (now > endDate) {
      status = 'completed'
    } else if (now >= startDate && now <= endDate) {
      status = 'in-progress'
    }

    return {
      id: data.id,
      date: data.date,
      startTime: data.start_time,
      endTime: data.end_time,
      location: data.location,
      plannedCount: data.planned_count,
      completedCount: data.completed_count,
      campaignIds: data.campaign_ids || [],
      teamMembers: data.team_members || [],
      responsible: data.responsible,
      status: status, // Calculated status
      notes: data.notes,
      facilityId: data.facility_id,
    }
  },

  // Helper to map App data to DB format
  mapToDbSchedule(data: Partial<QurbanSchedule>): any {
    const dbData: any = {}

    if ('date' in data) dbData.date = data.date
    if ('startTime' in data) dbData.start_time = data.startTime
    if ('endTime' in data) dbData.end_time = data.endTime
    if ('location' in data) dbData.location = data.location
    if ('plannedCount' in data) dbData.planned_count = data.plannedCount
    if ('completedCount' in data) dbData.completed_count = data.completedCount
    if ('campaignIds' in data) dbData.campaign_ids = data.campaignIds
    if ('teamMembers' in data) dbData.team_members = data.teamMembers
    if ('responsible' in data) dbData.responsible = data.responsible
    if ('notes' in data) dbData.notes = data.notes
    if ('facilityId' in data) dbData.facility_id = data.facilityId

    // Status is calculated, not stored directly (or stored but overwritten by calculation)
    // We don't map 'status' to DB to avoid conflicts if we want it purely dynamic

    return dbData
  },

  async getSchedules(filters?: { facilityId?: string; startDate?: string; endDate?: string }): Promise<QurbanSchedule[]> {
    try {
      let query = supabase.from('qurban_schedules').select('*')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate)
      }

      const { data, error } = await query.order('date', { ascending: true })

      if (error) throw error
      return (data || []).map(this.mapToSchedule)
    } catch (error) {
      console.error('Get schedules error:', error)
      return []
    }
  },

  async createSchedule(scheduleData: Partial<QurbanSchedule>): Promise<QurbanSchedule> {
    try {
      const dbData = this.mapToDbSchedule(scheduleData)
      const { data, error } = await supabase
        .from('qurban_schedules')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return this.mapToSchedule(data)
    } catch (error) {
      console.error('Create schedule error:', error)
      throw error
    }
  },

  async updateSchedule(id: string, updates: Partial<QurbanSchedule>): Promise<QurbanSchedule> {
    try {
      const dbUpdates = this.mapToDbSchedule(updates)
      const { data, error } = await supabase
        .from('qurban_schedules')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      const schedule = this.mapToSchedule(data)

      // If completedCount was updated, sync with campaign's completedAnimals
      if ('completedCount' in updates && schedule.campaignIds && schedule.campaignIds.length > 0) {
        // Update each campaign's completedAnimals based on all schedules
        for (const campaignId of schedule.campaignIds) {
          await this.updateCampaignCompletedAnimals(campaignId)
        }
      }

      return schedule
    } catch (error) {
      console.error('Update schedule error:', error)
      throw error
    }
  },

  // Update campaign's completedAnimals from schedules
  async updateCampaignCompletedAnimals(campaignId: string): Promise<void> {
    try {
      // Get all schedules for this campaign
      const { data: schedules, error: schedulesError } = await supabase
        .from('qurban_schedules')
        .select('completed_count')
        .contains('campaign_ids', [campaignId])

      if (schedulesError) throw schedulesError

      // Sum up completed counts from all schedules
      const totalCompleted = (schedules || []).reduce((sum, s) => sum + (s.completed_count || 0), 0)

      // Update campaign's completedAnimals
      const { error: updateError } = await supabase
        .from('qurban_campaigns')
        .update({ completed_animals: totalCompleted })
        .eq('id', campaignId)

      if (updateError) throw updateError

      console.log(`Campaign ${campaignId} completedAnimals updated to ${totalCompleted} from schedules`)
    } catch (error) {
      console.error('Update campaign completed animals error:', error)
    }
  },

  async deleteSchedule(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('qurban_schedules')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete schedule error:', error)
      throw error
    }
  }
}

export const distributionService = {
  // Helper to map DB result to App type
  mapToDistribution(data: any): DistributionRecord {
    return {
      id: data.id,
      date: data.date,
      facilityId: data.facility_id,
      campaignId: data.campaign_id,
      campaignName: data.campaign_name || '',
      distributionType: data.distribution_type,
      region: data.region,
      packageCount: data.package_count,
      totalWeight: data.total_weight,
      averageWeightPerPackage: data.average_weight_per_package,
      distributionList: data.distribution_list,
      packageNumber: data.package_number,
      recipientName: data.recipient_name,
      recipientCode: data.recipient_code,
      weight: data.weight,
      status: data.status,
      receivedBy: data.received_by,
      signature: data.signature,
      photo: data.photo,
      notes: data.notes,
    }
  },

  // Helper to map App data to DB format
  mapToDbDistribution(data: Partial<DistributionRecord>): any {
    const dbData: any = {}

    if ('date' in data) dbData.date = data.date
    if ('facilityId' in data) dbData.facility_id = data.facilityId
    if ('campaignId' in data) dbData.campaign_id = data.campaignId
    if ('campaignName' in data) dbData.campaign_name = data.campaignName
    if ('distributionType' in data) dbData.distribution_type = data.distributionType
    if ('region' in data) dbData.region = data.region
    if ('packageCount' in data) dbData.package_count = data.packageCount
    if ('totalWeight' in data) dbData.total_weight = data.totalWeight
    if ('averageWeightPerPackage' in data) dbData.average_weight_per_package = data.averageWeightPerPackage
    if ('distributionList' in data) dbData.distribution_list = data.distributionList
    if ('packageNumber' in data) dbData.package_number = data.packageNumber
    if ('recipientName' in data) dbData.recipient_name = data.recipientName
    if ('recipientCode' in data) dbData.recipient_code = data.recipientCode
    if ('weight' in data) dbData.weight = data.weight
    if ('status' in data) dbData.status = data.status
    if ('receivedBy' in data) dbData.receivedBy = data.receivedBy // received_by in DB? Let's assume snake_case
    if ('signature' in data) dbData.signature = data.signature
    if ('photo' in data) dbData.photo = data.photo
    if ('notes' in data) dbData.notes = data.notes

    // Fix receivedBy mapping
    if ('receivedBy' in data) dbData.received_by = data.receivedBy
    delete dbData.receivedBy

    return dbData
  },

  async getDistributions(filters?: { facilityId?: string; status?: string }): Promise<DistributionRecord[]> {
    try {
      let query = supabase.from('distribution_records').select('*')

      if (filters?.facilityId) {
        query = query.eq('facility_id', filters.facilityId)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      return (data || []).map(this.mapToDistribution)
    } catch (error) {
      console.error('Get distributions error:', error)
      return []
    }
  },

  async createDistribution(distributionData: Partial<DistributionRecord>): Promise<DistributionRecord> {
    try {
      const dbData = this.mapToDbDistribution(distributionData)
      const { data, error } = await supabase
        .from('distribution_records')
        .insert(dbData)
        .select()
        .single()

      if (error) throw error
      return this.mapToDistribution(data)
    } catch (error) {
      console.error('Create distribution error:', error)
      throw error
    }
  },

  async updateDistribution(id: string, updates: Partial<DistributionRecord>): Promise<DistributionRecord> {
    try {
      const dbUpdates = this.mapToDbDistribution(updates)
      const { data, error } = await supabase
        .from('distribution_records')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return this.mapToDistribution(data)
    } catch (error) {
      console.error('Update distribution error:', error)
      throw error
    }
  },

  async uploadDistributionPhoto(file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('qurban-photos')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage
        .from('qurban-photos')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Upload photo error:', error)
      throw error
    }
  },

  async deleteDistribution(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('distribution_records')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Delete distribution error:', error)
      throw error
    }
  }
}
