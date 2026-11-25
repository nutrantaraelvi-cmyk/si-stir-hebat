import { Link } from 'react-router-dom'
import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { useTrackVisit } from './workspace-context'

export type ServiceLink = { to: string; icon: LucideIcon; title: string; detail: string }
export type PortalServiceGroup = { id: string; number: string; title: string; detail: string; services: ServiceLink[] }

// Satu kartu layanan untuk semua ruang peran. Nama kelas mengikuti prefiks ruang
// (student-, teacher-, portal-) sehingga gaya yang sudah ada tetap berlaku.
export function ServiceCard({ service, prefix, modifier }: { service: ServiceLink; prefix: 'student' | 'teacher' | 'portal'; modifier?: string }) {
  const { to, icon: Icon, title, detail } = service
  const track = useTrackVisit()
  return <Link className={`${prefix}-service-card${modifier ? ` ${prefix}-service-card--${modifier}` : ''}`} to={to} onClick={() => track(to)} data-reveal>
    <span className={`${prefix}-service-icon`}><Icon size={20} aria-hidden="true"/></span>
    <span className={`${prefix}-service-copy`}><strong>{title}</strong><small>{detail}</small></span>
    <ArrowUpRight size={17} aria-hidden="true"/>
  </Link>
}

export function PortalServiceGroups({ groups, audience }: { groups: PortalServiceGroup[]; audience: 'principal' | 'parent' }) {
  return <>{groups.map(group => group.services.length > 0 && <section className={`portal-service-group portal-service-group--${audience}`} key={group.id} aria-labelledby={group.id}>
    <header><span className="portal-group-number">{group.number}</span><div><h3 id={group.id}>{group.title}</h3><p>{group.detail}</p></div></header>
    <div className="portal-service-grid">{group.services.map(service => <ServiceCard prefix="portal" modifier={audience} service={service} key={service.to}/>)}</div>
  </section>)}</>
}
