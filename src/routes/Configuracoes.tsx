import { motion } from 'framer-motion'
import { AppFooter } from '@/components/layout/AppFooter'
import { PageContainer } from '@/components/layout/PageContainer'
import { ThemePicker } from '@/components/theme/ThemePicker'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

export function Configuracoes() {
  return (
    <PageContainer
      footer={false}
      className="h-dvh overflow-hidden pb-24 md:h-auto md:overflow-visible md:pb-8"
    >
      <header className="mb-3 shrink-0">
        <h1 className="text-xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Tema, papel de parede e tipografia. Preferências ficam neste aparelho.
        </p>
      </header>

      <ScrollArea className="min-h-0 min-w-0 flex-1 md:overflow-visible">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5 pb-3"
        >
          <ThemePicker />
          <Separator />
          <p className="text-[11px] text-muted-foreground">
            Mesa Cheia não tem servidor. Partidas e tema vivem só no navegador desta aba.
          </p>
          <AppFooter />
        </motion.div>
      </ScrollArea>
    </PageContainer>
  )
}
