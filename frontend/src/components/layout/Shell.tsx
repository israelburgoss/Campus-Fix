import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

export function Shell({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <>
      <TopBar title={title} subtitle={subtitle} actions={actions} />
      <main style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>{children}</main>
    </>
  )
}
