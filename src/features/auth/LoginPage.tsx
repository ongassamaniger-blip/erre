import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Buildings, Lock, EnvelopeSimple, CheckCircle } from '@phosphor-icons/react'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore(state => state.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [language, setLanguage] = useState<'TR' | 'EN'>('TR')
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  // Check if coming from email confirmation
  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setEmailConfirmed(true)
      toast.success(language === 'TR' ? 'E-posta adresiniz onaylandı! Şimdi giriş yapabilirsiniz.' : 'Email confirmed! You can now login.')
    }
  }, [searchParams, language])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      toast.error(language === 'TR' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password)

      if (result.success) {
        toast.success(language === 'TR' ? 'Giriş başarılı!' : 'Login successful!')

        const currentUser = useAuthStore.getState().user
        if (currentUser && currentUser.id && currentUser.facilityAccess && currentUser.facilityAccess.length > 0) {
          navigate('/tenant-select')
        } else {
          toast.error(language === 'TR' ? 'Kullanıcı bilgileri veya yetkileri eksik' : 'User data or permissions missing')
        }
      } else {
        // Display specific error message
        if (result.code === 'AUTH_ERROR') {
          toast.error(language === 'TR' ? 'E-posta veya şifre hatalı' : 'Invalid email or password')
        } else if (result.code === 'PROFILE_ERROR') {
          toast.error(language === 'TR' ? 'Profil ayarlanıyor, lütfen tekrar deneyin.' : 'Profile is being set up, please try again.')
        } else if (result.code === 'NOT_SUPER_ADMIN') {
          toast.error(language === 'TR' ? 'Bu hesap için erişim yetkisi bulunmuyor.' : 'No access permission for this account.')
        } else {
          toast.error(result.error || (language === 'TR' ? 'Giriş yapılamadı' : 'Login failed'))
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error(language === 'TR' ? 'Bir hata oluştu' : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const texts = {
    TR: {
      title: 'Hoş Geldiniz',
      subtitle: 'Kurumsal Yönetim Sistemi',
      email: 'E-posta',
      password: 'Şifre',
      login: 'Giriş Yap',
      forgot: 'Şifremi Unuttum',
      register: 'Hesabınız yok mu? Kayıt Olun'
    },
    EN: {
      title: 'Welcome',
      subtitle: 'Corporate Management System',
      email: 'Email',
      password: 'Password',
      login: 'Login',
      forgot: 'Forgot Password',
      register: 'No account? Register'
    }
  }

  const t = texts[language]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLanguage(prev => prev === 'TR' ? 'EN' : 'TR')}
        >
          {language}
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center space-y-4 pb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Buildings size={32} weight="duotone" className="text-primary" />
              </div>
            </motion.div>
            <div>
              <CardTitle className="text-2xl font-semibold">{t.title}</CardTitle>
              <CardDescription className="text-base mt-2">{t.subtitle}</CardDescription>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t.email}</Label>
                <div className="relative">
                  <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.password}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t.forgot}
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (language === 'TR' ? 'Giriş yapılıyor...' : 'Logging in...') : t.login}
              </Button>

              <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                <Link to="/register" className="text-primary hover:underline font-medium">
                  {t.register}
                </Link>
              </div>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
