import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Buildings, Lock, EnvelopeSimple, User } from '@phosphor-icons/react'

export function RegisterPage() {
    const navigate = useNavigate()
    const register = useAuthStore(state => state.register)

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [language, setLanguage] = useState<'TR' | 'EN'>('TR')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name || !email || !password || !confirmPassword) {
            toast.error(language === 'TR' ? 'Lütfen tüm alanları doldurun' : 'Please fill all fields')
            return
        }

        if (password !== confirmPassword) {
            toast.error(language === 'TR' ? 'Şifreler eşleşmiyor' : 'Passwords do not match')
            return
        }

        if (password.length < 6) {
            toast.error(language === 'TR' ? 'Şifre en az 6 karakter olmalı' : 'Password must be at least 6 characters')
            return
        }

        setIsLoading(true)

        try {
            const { success, error } = await register(email, password, name)

            if (success) {
                toast.success(language === 'TR' ? 'Kayıt başarılı! Lütfen e-postanızı onaylayın.' : 'Registration successful! Please confirm your email.')
                navigate('/login')
            } else {
                toast.error(error || (language === 'TR' ? 'Kayıt başarısız' : 'Registration failed'))
            }
        } catch (error) {
            console.error('Register error:', error)
            toast.error(language === 'TR' ? 'Bir hata oluştu' : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const texts = {
        TR: {
            title: 'Kayıt Ol',
            subtitle: 'Kurumsal Yönetim Sistemi',
            name: 'Ad Soyad',
            email: 'E-posta',
            password: 'Şifre',
            confirmPassword: 'Şifre Tekrar',
            register: 'Kayıt Ol',
            login: 'Giriş Yap',
            haveAccount: 'Zaten hesabınız var mı?'
        },
        EN: {
            title: 'Register',
            subtitle: 'Corporate Management System',
            name: 'Full Name',
            email: 'Email',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            register: 'Register',
            login: 'Login',
            haveAccount: 'Already have an account?'
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
                                <Label htmlFor="name">{t.name}</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Ahmet Yılmaz"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">{t.email}</Label>
                                <div className="relative">
                                    <EnvelopeSimple className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="ornek@sirket.com"
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

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pl-10"
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                size="lg"
                                disabled={isLoading}
                            >
                                {isLoading ? (language === 'TR' ? 'Kayıt yapılıyor...' : 'Registering...') : t.register}
                            </Button>

                            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
                                {t.haveAccount}{' '}
                                <Link to="/login" className="text-primary hover:underline font-medium">
                                    {t.login}
                                </Link>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
