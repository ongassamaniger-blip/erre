import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Buildings, EnvelopeSimple, ArrowLeft } from '@phosphor-icons/react'

export function ForgotPasswordPage() {
    const navigate = useNavigate()
    const resetPasswordForEmail = useAuthStore(state => state.resetPasswordForEmail)

    const [email, setEmail] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [language, setLanguage] = useState<'TR' | 'EN'>('TR')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email) {
            toast.error(language === 'TR' ? 'Lütfen e-posta adresinizi girin' : 'Please enter your email')
            return
        }

        setIsLoading(true)

        try {
            const { success, error } = await resetPasswordForEmail(email)

            if (success) {
                toast.success(language === 'TR' ? 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi' : 'Password reset link sent to your email')
                navigate('/login')
            } else {
                toast.error(error || (language === 'TR' ? 'İşlem başarısız' : 'Operation failed'))
            }
        } catch (error) {
            console.error('Forgot password error:', error)
            toast.error(language === 'TR' ? 'Bir hata oluştu' : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const texts = {
        TR: {
            title: 'Şifremi Unuttum',
            subtitle: 'E-posta adresinize sıfırlama bağlantısı göndereceğiz',
            email: 'E-posta',
            send: 'Bağlantı Gönder',
            back: 'Giriş sayfasına dön'
        },
        EN: {
            title: 'Forgot Password',
            subtitle: 'We will send a reset link to your email',
            email: 'Email',
            send: 'Send Link',
            back: 'Back to login'
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
                                        placeholder="ornek@sirket.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
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
                                {isLoading ? (language === 'TR' ? 'Gönderiliyor...' : 'Sending...') : t.send}
                            </Button>

                            <div className="text-center pt-4 border-t">
                                <Link to="/login" className="text-sm text-muted-foreground hover:text-primary flex items-center justify-center gap-2">
                                    <ArrowLeft size={16} />
                                    {t.back}
                                </Link>
                            </div>
                        </CardContent>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
