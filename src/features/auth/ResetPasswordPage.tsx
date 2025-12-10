import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Buildings, Lock } from '@phosphor-icons/react'

export function ResetPasswordPage() {
    const navigate = useNavigate()
    const updateUserPassword = useAuthStore(state => state.updateUserPassword)

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [language, setLanguage] = useState<'TR' | 'EN'>('TR')
    const [isSessionValid, setIsSessionValid] = useState(false)

    useEffect(() => {
        // Check if we have a valid session (from the reset link)
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                setIsSessionValid(true)
            } else {
                // Wait a bit for the hash to be processed
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession()
                    if (retrySession) {
                        setIsSessionValid(true)
                    } else {
                        toast.error(language === 'TR' ? 'Geçersiz veya süresi dolmuş bağlantı' : 'Invalid or expired link')
                        navigate('/login')
                    }
                }, 1000)
            }
        }

        checkSession()
    }, [navigate, language])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!password || !confirmPassword) {
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
            const { success, error } = await updateUserPassword(password)

            if (success) {
                toast.success(language === 'TR' ? 'Şifreniz başarıyla güncellendi' : 'Password updated successfully')
                navigate('/login')
            } else {
                toast.error(error || (language === 'TR' ? 'Güncelleme başarısız' : 'Update failed'))
            }
        } catch (error) {
            console.error('Reset password error:', error)
            toast.error(language === 'TR' ? 'Bir hata oluştu' : 'An error occurred')
        } finally {
            setIsLoading(false)
        }
    }

    const texts = {
        TR: {
            title: 'Yeni Şifre Belirle',
            subtitle: 'Lütfen yeni şifrenizi girin',
            password: 'Yeni Şifre',
            confirmPassword: 'Şifre Tekrar',
            update: 'Şifreyi Güncelle'
        },
        EN: {
            title: 'Set New Password',
            subtitle: 'Please enter your new password',
            password: 'New Password',
            confirmPassword: 'Confirm Password',
            update: 'Update Password'
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
                                {isLoading ? (language === 'TR' ? 'Güncelleniyor...' : 'Updating...') : t.update}
                            </Button>
                        </CardContent>
                    </form>
                </Card>
            </motion.div>
        </div>
    )
}
