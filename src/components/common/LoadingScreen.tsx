import { motion, AnimatePresence } from 'framer-motion'

interface LoadingScreenProps {
  message?: string
  show?: boolean
}

export function LoadingScreen({ message = 'Yükleniyor', show = true }: LoadingScreenProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed inset-0 z-[9999] bg-background flex items-center justify-center flex-col gap-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 relative z-10 shadow-lg">
              <span className="text-primary font-bold text-3xl">KY</span>
            </div>
            <motion.div
              className="absolute inset-0 bg-primary/20 rounded-2xl -z-10"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <h3 className="text-xl font-semibold text-foreground">{message}</h3>
            <div className="flex gap-1.5">
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-primary"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0 }}
              />
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-primary"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.15 }}
              />
              <motion.div
                className="w-2.5 h-2.5 rounded-full bg-primary"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: 0.3 }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
