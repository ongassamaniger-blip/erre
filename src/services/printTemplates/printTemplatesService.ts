import type { PrintTemplate, PrintTemplateCode, PrintField } from '@/types/printTemplates'

const mockTemplates: PrintTemplate[] = [
  // NOTE: This service currently uses mock data for print templates.
  // In a production environment, these templates should be stored in a database table (e.g., 'print_templates').
  // Since no such table exists in the current Supabase schema, we are using static definitions here.
  {
    id: 'pt-finance-transaction',
    code: 'finance.transaction',
    name: {
      tr: 'Finans İşlem Belgesi',
      en: 'Finance Transaction Document',
      fr: 'Document de Transaction Financière',
      ar: 'وثيقة المعاملة المالية'
    },
    tenantScope: 'GLOBAL',
    headerFields: [
      {
        id: 'hf-1',
        key: 'tenantName',
        label: {
          tr: 'Kurum Adı',
          en: 'Organization Name',
          fr: 'Nom de l\'Organisation',
          ar: 'اسم المنظمة'
        },
        section: 'header',
        visible: true,
        order: 1,
        align: 'center',
        bold: true
      },
      {
        id: 'hf-2',
        key: 'facilityName',
        label: {
          tr: 'Tesis Adı',
          en: 'Facility Name',
          fr: 'Nom de l\'Établissement',
          ar: 'اسم المنشأة'
        },
        section: 'header',
        visible: true,
        order: 2,
        align: 'center'
      },
      {
        id: 'hf-3',
        key: 'documentTitle',
        label: {
          tr: 'Gelir/Gider Dekontu',
          en: 'Income/Expense Voucher',
          fr: 'Bon de Recette/Dépense',
          ar: 'قسيمة الإيرادات/المصروفات'
        },
        section: 'header',
        visible: true,
        order: 3,
        align: 'center',
        bold: true
      },
      {
        id: 'hf-4',
        key: 'printDate',
        label: {
          tr: 'Yazdırma Tarihi',
          en: 'Print Date',
          fr: 'Date d\'Impression',
          ar: 'تاريخ الطباعة'
        },
        section: 'header',
        visible: true,
        order: 4,
        align: 'right'
      }
    ],
    bodyFields: [
      {
        id: 'bf-1',
        key: 'transactionCode',
        label: {
          tr: 'İşlem Kodu',
          en: 'Transaction Code',
          fr: 'Code de Transaction',
          ar: 'رمز المعاملة'
        },
        section: 'body',
        visible: true,
        order: 1,
        width: 150
      },
      {
        id: 'bf-2',
        key: 'transactionDate',
        label: {
          tr: 'Tarih',
          en: 'Date',
          fr: 'Date',
          ar: 'التاريخ'
        },
        section: 'body',
        visible: true,
        order: 2,
        width: 120
      },
      {
        id: 'bf-3',
        key: 'title',
        label: {
          tr: 'Açıklama',
          en: 'Description',
          fr: 'Description',
          ar: 'الوصف'
        },
        section: 'body',
        visible: true,
        order: 3,
        width: null
      },
      {
        id: 'bf-4',
        key: 'categoryName',
        label: {
          tr: 'Kategori',
          en: 'Category',
          fr: 'Catégorie',
          ar: 'الفئة'
        },
        section: 'body',
        visible: true,
        order: 4,
        width: 150
      },
      {
        id: 'bf-5',
        key: 'vendorCustomerName',
        label: {
          tr: 'Tedarikçi/Müşteri',
          en: 'Vendor/Customer',
          fr: 'Fournisseur/Client',
          ar: 'المورد/العميل'
        },
        section: 'body',
        visible: true,
        order: 5,
        width: 180
      },
      {
        id: 'bf-6',
        key: 'amount',
        label: {
          tr: 'Tutar',
          en: 'Amount',
          fr: 'Montant',
          ar: 'المبلغ'
        },
        section: 'body',
        visible: true,
        order: 6,
        align: 'right',
        bold: true,
        width: 120
      },
      {
        id: 'bf-7',
        key: 'currency',
        label: {
          tr: 'Para Birimi',
          en: 'Currency',
          fr: 'Devise',
          ar: 'العملة'
        },
        section: 'body',
        visible: true,
        order: 7,
        width: 80
      }
    ],
    footerFields: [
      {
        id: 'ff-1',
        key: 'generatedMessage',
        label: {
          tr: 'Bu belge bilgisayar ortamında hazırlanmıştır.',
          en: 'This document was generated electronically.',
          fr: 'Ce document a été généré électroniquement.',
          ar: 'تم إنشاء هذا المستند إلكترونياً.'
        },
        section: 'footer',
        visible: true,
        order: 1,
        align: 'center',
        italic: true
      },
      {
        id: 'ff-2',
        key: 'contactInfo',
        label: {
          tr: 'İletişim: info@ornek.com | Tel: +90 XXX XXX XX XX',
          en: 'Contact: info@example.com | Tel: +90 XXX XXX XX XX',
          fr: 'Contact: info@exemple.com | Tél: +90 XXX XXX XX XX',
          ar: 'الاتصال: info@example.com | الهاتف: +90 XXX XXX XX XX'
        },
        section: 'footer',
        visible: true,
        order: 2,
        align: 'center'
      }
    ],
    signatureFields: [
      {
        id: 'sf-1',
        key: 'preparedBy',
        label: {
          tr: 'Hazırlayan',
          en: 'Prepared By',
          fr: 'Préparé Par',
          ar: 'أعدت بواسطة'
        },
        section: 'signatures',
        visible: true,
        order: 1,
        align: 'left'
      },
      {
        id: 'sf-2',
        key: 'approvedBy',
        label: {
          tr: 'Onaylayan',
          en: 'Approved By',
          fr: 'Approuvé Par',
          ar: 'تمت الموافقة من قبل'
        },
        section: 'signatures',
        visible: true,
        order: 2,
        align: 'right'
      }
    ],
    pageOrientation: 'portrait',
    showLogo: true,
    logoPosition: 'left',
    showPageNumber: true,
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: 'pt-hr-payslip',
    code: 'hr.payslip',
    name: {
      tr: 'Bordro / Maaş Bordrosu',
      en: 'Payslip / Salary Statement',
      fr: 'Fiche de Paie',
      ar: 'كشف الراتب'
    },
    tenantScope: 'GLOBAL',
    headerFields: [
      {
        id: 'hf-ps-1',
        key: 'organizationName',
        label: {
          tr: 'Kurum Adı',
          en: 'Organization Name',
          fr: 'Nom de l\'Organisation',
          ar: 'اسم المنظمة'
        },
        section: 'header',
        visible: true,
        order: 1,
        align: 'center',
        bold: true
      },
      {
        id: 'hf-ps-2',
        key: 'documentTitle',
        label: {
          tr: 'MAAŞ BORDROSU',
          en: 'PAYSLIP',
          fr: 'FICHE DE PAIE',
          ar: 'كشف الراتب'
        },
        section: 'header',
        visible: true,
        order: 2,
        align: 'center',
        bold: true
      },
      {
        id: 'hf-ps-3',
        key: 'employeeName',
        label: {
          tr: 'Çalışan Adı',
          en: 'Employee Name',
          fr: 'Nom de l\'Employé',
          ar: 'اسم الموظف'
        },
        section: 'header',
        visible: true,
        order: 3,
        align: 'left'
      },
      {
        id: 'hf-ps-4',
        key: 'period',
        label: {
          tr: 'Dönem',
          en: 'Period',
          fr: 'Période',
          ar: 'الفترة'
        },
        section: 'header',
        visible: true,
        order: 4,
        align: 'right'
      }
    ],
    bodyFields: [
      {
        id: 'bf-ps-1',
        key: 'itemDescription',
        label: {
          tr: 'Açıklama',
          en: 'Description',
          fr: 'Description',
          ar: 'الوصف'
        },
        section: 'body',
        visible: true,
        order: 1,
        width: null
      },
      {
        id: 'bf-ps-2',
        key: 'earnings',
        label: {
          tr: 'Kazançlar',
          en: 'Earnings',
          fr: 'Gains',
          ar: 'الأرباح'
        },
        section: 'body',
        visible: true,
        order: 2,
        align: 'right',
        width: 150
      },
      {
        id: 'bf-ps-3',
        key: 'deductions',
        label: {
          tr: 'Kesintiler',
          en: 'Deductions',
          fr: 'Déductions',
          ar: 'الخصومات'
        },
        section: 'body',
        visible: true,
        order: 3,
        align: 'right',
        width: 150
      },
      {
        id: 'bf-ps-4',
        key: 'netAmount',
        label: {
          tr: 'Net Tutar',
          en: 'Net Amount',
          fr: 'Montant Net',
          ar: 'المبلغ الصافي'
        },
        section: 'body',
        visible: true,
        order: 4,
        align: 'right',
        bold: true,
        width: 150
      }
    ],
    footerFields: [
      {
        id: 'ff-ps-1',
        key: 'confidentialityNotice',
        label: {
          tr: 'Bu belge gizlidir ve yetkisiz kişilerle paylaşılmamalıdır.',
          en: 'This document is confidential and should not be shared with unauthorized persons.',
          fr: 'Ce document est confidentiel et ne doit pas être partagé avec des personnes non autorisées.',
          ar: 'هذه الوثيقة سرية ولا ينبغي مشاركتها مع أشخاص غير مصرح لهم.'
        },
        section: 'footer',
        visible: true,
        order: 1,
        align: 'center',
        italic: true
      }
    ],
    signatureFields: [
      {
        id: 'sf-ps-1',
        key: 'employer',
        label: {
          tr: 'İşveren / Yetkili',
          en: 'Employer / Authorized',
          fr: 'Employeur / Autorisé',
          ar: 'صاحب العمل / مفوض'
        },
        section: 'signatures',
        visible: true,
        order: 1,
        align: 'left'
      },
      {
        id: 'sf-ps-2',
        key: 'employee',
        label: {
          tr: 'Çalışan',
          en: 'Employee',
          fr: 'Employé',
          ar: 'الموظف'
        },
        section: 'signatures',
        visible: true,
        order: 2,
        align: 'right'
      }
    ],
    pageOrientation: 'portrait',
    showLogo: true,
    logoPosition: 'center',
    showPageNumber: false,
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: 'pt-qurban-certificate',
    code: 'qurban.certificate',
    name: {
      tr: 'Kurban Sertifikası',
      en: 'Qurban Certificate',
      fr: 'Certificat de Qurban',
      ar: 'شهادة الأضحية'
    },
    tenantScope: 'GLOBAL',
    headerFields: [
      {
        id: 'hf-qc-1',
        key: 'organizationName',
        label: {
          tr: 'Kurum Adı',
          en: 'Organization Name',
          fr: 'Nom de l\'Organisation',
          ar: 'اسم المنظمة'
        },
        section: 'header',
        visible: true,
        order: 1,
        align: 'center',
        bold: true
      },
      {
        id: 'hf-qc-2',
        key: 'certificateTitle',
        label: {
          tr: 'KURBAN SERTİFİKASI',
          en: 'QURBAN CERTIFICATE',
          fr: 'CERTIFICAT DE QURBAN',
          ar: 'شهادة الأضحية'
        },
        section: 'header',
        visible: true,
        order: 2,
        align: 'center',
        bold: true
      }
    ],
    bodyFields: [
      {
        id: 'bf-qc-1',
        key: 'donorName',
        label: {
          tr: 'Bağışçı Adı',
          en: 'Donor Name',
          fr: 'Nom du Donateur',
          ar: 'اسم المتبرع'
        },
        section: 'body',
        visible: true,
        order: 1,
        width: null,
        bold: true
      },
      {
        id: 'bf-qc-2',
        key: 'qurbanType',
        label: {
          tr: 'Kurban Türü',
          en: 'Qurban Type',
          fr: 'Type de Qurban',
          ar: 'نوع الأضحية'
        },
        section: 'body',
        visible: true,
        order: 2,
        width: 200
      },
      {
        id: 'bf-qc-3',
        key: 'distributionRegion',
        label: {
          tr: 'Dağıtım Bölgesi',
          en: 'Distribution Region',
          fr: 'Région de Distribution',
          ar: 'منطقة التوزيع'
        },
        section: 'body',
        visible: true,
        order: 3,
        width: 200
      },
      {
        id: 'bf-qc-4',
        key: 'slaughterDate',
        label: {
          tr: 'Kesim Tarihi',
          en: 'Slaughter Date',
          fr: 'Date d\'Abattage',
          ar: 'تاريخ الذبح'
        },
        section: 'body',
        visible: true,
        order: 4,
        width: 150
      },
      {
        id: 'bf-qc-5',
        key: 'certificateNumber',
        label: {
          tr: 'Sertifika No',
          en: 'Certificate No',
          fr: 'N° de Certificat',
          ar: 'رقم الشهادة'
        },
        section: 'body',
        visible: true,
        order: 5,
        width: 150,
        bold: true
      }
    ],
    footerFields: [
      {
        id: 'ff-qc-1',
        key: 'thanksMessage',
        label: {
          tr: 'Katkılarınız için teşekkür ederiz.',
          en: 'Thank you for your contribution.',
          fr: 'Merci pour votre contribution.',
          ar: 'شكراً لمساهمتكم.'
        },
        section: 'footer',
        visible: true,
        order: 1,
        align: 'center',
        italic: true
      }
    ],
    signatureFields: [
      {
        id: 'sf-qc-1',
        key: 'responsiblePerson',
        label: {
          tr: 'Sorumlu Kişi',
          en: 'Responsible Person',
          fr: 'Personne Responsable',
          ar: 'الشخص المسؤول'
        },
        section: 'signatures',
        visible: true,
        order: 1,
        align: 'center'
      }
    ],
    pageOrientation: 'landscape',
    showLogo: true,
    logoPosition: 'center',
    showPageNumber: false,
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  },
  {
    id: 'pt-finance-budget',
    code: 'finance.budget',
    name: {
      tr: 'Bütçe Raporu',
      en: 'Budget Report',
      fr: 'Rapport Budgétaire',
      ar: 'تقرير الميزانية'
    },
    tenantScope: 'GLOBAL',
    headerFields: [
      {
        id: 'hf-fb-1',
        key: 'organizationName',
        label: {
          tr: 'Kurum Adı',
          en: 'Organization Name',
          fr: 'Nom de l\'Organisation',
          ar: 'اسم المنظمة'
        },
        section: 'header',
        visible: true,
        order: 1,
        align: 'center',
        bold: true
      },
      {
        id: 'hf-fb-2',
        key: 'reportTitle',
        label: {
          tr: 'BÜTÇE RAPORU',
          en: 'BUDGET REPORT',
          fr: 'RAPPORT BUDGÉTAIRE',
          ar: 'تقرير الميزانية'
        },
        section: 'header',
        visible: true,
        order: 2,
        align: 'center',
        bold: true
      },
      {
        id: 'hf-fb-3',
        key: 'fiscalPeriod',
        label: {
          tr: 'Mali Dönem',
          en: 'Fiscal Period',
          fr: 'Période Fiscale',
          ar: 'الفترة المالية'
        },
        section: 'header',
        visible: true,
        order: 3,
        align: 'right'
      }
    ],
    bodyFields: [
      {
        id: 'bf-fb-1',
        key: 'categoryName',
        label: {
          tr: 'Kategori',
          en: 'Category',
          fr: 'Catégorie',
          ar: 'الفئة'
        },
        section: 'body',
        visible: true,
        order: 1,
        width: null
      },
      {
        id: 'bf-fb-2',
        key: 'budgetedAmount',
        label: {
          tr: 'Bütçe',
          en: 'Budgeted',
          fr: 'Budgété',
          ar: 'المقرر'
        },
        section: 'body',
        visible: true,
        order: 2,
        align: 'right',
        width: 150
      },
      {
        id: 'bf-fb-3',
        key: 'actualAmount',
        label: {
          tr: 'Gerçekleşen',
          en: 'Actual',
          fr: 'Réalisé',
          ar: 'الفعلي'
        },
        section: 'body',
        visible: true,
        order: 3,
        align: 'right',
        width: 150
      },
      {
        id: 'bf-fb-4',
        key: 'variance',
        label: {
          tr: 'Fark',
          en: 'Variance',
          fr: 'Écart',
          ar: 'الفرق'
        },
        section: 'body',
        visible: true,
        order: 4,
        align: 'right',
        width: 150
      },
      {
        id: 'bf-fb-5',
        key: 'percentage',
        label: {
          tr: '%',
          en: '%',
          fr: '%',
          ar: '%'
        },
        section: 'body',
        visible: true,
        order: 5,
        align: 'right',
        bold: true,
        width: 100
      }
    ],
    footerFields: [
      {
        id: 'ff-fb-1',
        key: 'generatedMessage',
        label: {
          tr: 'Bu rapor sistem tarafından otomatik oluşturulmuştur.',
          en: 'This report was automatically generated by the system.',
          fr: 'Ce rapport a été généré automatiquement par le système.',
          ar: 'تم إنشاء هذا التقرير تلقائياً بواسطة النظام.'
        },
        section: 'footer',
        visible: true,
        order: 1,
        align: 'center',
        italic: true
      }
    ],
    signatureFields: [
      {
        id: 'sf-fb-1',
        key: 'financialManager',
        label: {
          tr: 'Mali İşler Müdürü',
          en: 'Financial Manager',
          fr: 'Directeur Financier',
          ar: 'المدير المالي'
        },
        section: 'signatures',
        visible: true,
        order: 1,
        align: 'left'
      },
      {
        id: 'sf-fb-2',
        key: 'generalDirector',
        label: {
          tr: 'Genel Müdür',
          en: 'General Director',
          fr: 'Directeur Général',
          ar: 'المدير العام'
        },
        section: 'signatures',
        visible: true,
        order: 2,
        align: 'right'
      }
    ],
    pageOrientation: 'landscape',
    showLogo: true,
    logoPosition: 'left',
    showPageNumber: true,
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system'
  }
]

let templates = [...mockTemplates]

export const printTemplatesService = {
  async getPrintTemplates(tenantId: string): Promise<PrintTemplate[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    return templates.filter(t =>
      t.tenantScope === 'GLOBAL' || t.tenantId === tenantId
    )
  },

  async getPrintTemplateByCode(code: PrintTemplateCode, tenantId: string): Promise<PrintTemplate> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const tenantSpecific = templates.find(t =>
      t.code === code && t.tenantScope === 'TENANT' && t.tenantId === tenantId
    )

    if (tenantSpecific) {
      return tenantSpecific
    }

    const globalTemplate = templates.find(t =>
      t.code === code && t.tenantScope === 'GLOBAL'
    )

    if (!globalTemplate) {
      throw new Error(`Print template not found: ${code}`)
    }

    return globalTemplate
  },

  async updatePrintTemplate(template: PrintTemplate): Promise<PrintTemplate> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const updatedTemplate: PrintTemplate = {
      ...template,
      version: template.version + 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    }

    const index = templates.findIndex(t => t.id === template.id)
    if (index !== -1) {
      templates[index] = updatedTemplate
    } else {
      templates.push(updatedTemplate)
    }

    return updatedTemplate
  },

  async createTenantOverride(globalTemplateId: string, tenantId: string): Promise<PrintTemplate> {
    await new Promise(resolve => setTimeout(resolve, 400))

    const globalTemplate = templates.find(t => t.id === globalTemplateId)
    if (!globalTemplate) {
      throw new Error('Global template not found')
    }

    const tenantTemplate: PrintTemplate = {
      ...globalTemplate,
      id: `${globalTemplateId}-tenant-${tenantId}`,
      tenantScope: 'TENANT',
      tenantId,
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    }

    templates.push(tenantTemplate)
    return tenantTemplate
  },

  async createTemplate(template: Omit<PrintTemplate, 'id' | 'version' | 'updatedAt' | 'updatedBy'>): Promise<PrintTemplate> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const newTemplate: PrintTemplate = {
      ...template,
      id: `template-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: 1,
      updatedAt: new Date().toISOString(),
      updatedBy: 'current-user'
    }

    templates.push(newTemplate)
    return newTemplate
  }
}
