'use client'

import { useRef } from 'react'
import { Link2, RotateCcw, Upload } from 'lucide-react'
import { getTranslations, type Language } from '@/lib/i18n'
import type { ContentType, QRConfig } from '@/lib/qr-config'

const inputClass = 'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:ring-indigo-950'
const labelClass = 'mb-1.5 block text-xs font-semibold text-zinc-600 dark:text-zinc-400'
type Option = { value: string; label: string }

function Field({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return <label className="block"><span className={labelClass}>{label}</span><input className={inputClass} type={type} value={value} onChange={event => onChange(event.target.value)} placeholder={placeholder} /></label>
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: Option[]; onChange: (value: string) => void }) {
  return <label className="block"><span className={labelClass}>{label}</span><select className={inputClass} value={value} onChange={event => onChange(event.target.value)}>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
}

function Range({ label, value, min, max, suffix = '', onChange }: { label: string; value: number; min: number; max: number; suffix?: string; onChange: (value: number) => void }) {
  return <label className="block"><span className={labelClass}>{label} <span className="float-right font-normal text-zinc-400">{value}{suffix}</span></span><input className="w-full accent-indigo-600" type="range" min={min} max={max} value={value} onChange={event => onChange(+event.target.value)} /></label>
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <div><span className={labelClass}>{label}</span><div className="flex gap-2"><input aria-label={`${label} selector`} className="h-10 w-12 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1" type="color" value={value} onChange={event => onChange(event.target.value)} /><input aria-label={`${label} hexadecimal`} className={`${inputClass} font-mono uppercase`} value={value} maxLength={7} onChange={event => onChange(event.target.value)} /></div></div>
}

const contentTypes: ContentType[] = ['URL', 'Texto', 'WiFi', 'vCard', 'Email', 'SMS', 'Teléfono']

export function ContentForm({ language, config, update }: { language: Language; config: QRConfig; update: (patch: Partial<QRConfig>) => void }) {
  const t = getTranslations(language)
  const values = config.values as Record<string, string>
  const set = (key: string, value: string) => update({ values: { ...config.values, [key]: value } })
  const type = config.contentType
  const field = (key: string, label: string, placeholder = '', kind = 'text') => <Field key={key} label={label} value={values[key] || ''} onChange={value => set(key, value)} placeholder={placeholder} type={kind} />
  const typeOptions = contentTypes.map(value => ({ value, label: t.content.types[value] }))
  const valuesByType: Record<ContentType, Record<string, string>> = {
    URL: { url: 'https://vercel.com' },
    Texto: { text: '' },
    WiFi: { ssid: '', password: '', encryption: 'WPA', hidden: 'false' },
    vCard: { first: '', last: '', phone: '', email: '', org: '', website: '' },
    Email: { email: '', subject: '', body: '' },
    SMS: { phone: '', message: '' },
    Teléfono: { phone: '' },
  }

  return <div className="space-y-3">
    <Select label={t.content.typeLabel} value={type} options={typeOptions} onChange={value => update({ contentType: value as ContentType, values: valuesByType[value as ContentType] })} />
    {type === 'URL' && field('url', t.content.webAddress, t.content.webPlaceholder)}
    {type === 'Texto' && <label className="block"><span className={labelClass}>{t.content.text}</span><textarea className={`${inputClass} min-h-24 resize-y`} value={values.text || ''} onChange={event => set('text', event.target.value)} placeholder={t.content.textPlaceholder} /></label>}
    {type === 'WiFi' && <>{field('ssid', t.content.networkName)}{field('password', t.content.password, '', 'password')}<Select label={t.content.security} value={values.encryption || 'WPA'} options={(['WPA', 'WEP', 'None'] as const).map(value => ({ value, label: t.style.securityOptions[value] }))} onChange={value => set('encryption', value)} /><label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={values.hidden === 'true'} onChange={event => set('hidden', String(event.target.checked))} className="accent-indigo-600" />{t.content.hiddenNetwork}</label></>}
    {type === 'vCard' && <div className="grid grid-cols-2 gap-3">{field('first', t.content.firstName)}{field('last', t.content.lastName)}{field('phone', t.content.phone)}{field('email', t.content.email, '', 'email')}{field('org', t.content.organization)}{field('website', t.content.website)}</div>}
    {type === 'Email' && <>{field('email', t.content.emailAddress, t.content.emailPlaceholder, 'email')}{field('subject', t.content.subject)}<label className="block"><span className={labelClass}>{t.content.message}</span><textarea className={`${inputClass} min-h-20`} value={values.body || ''} onChange={event => set('body', event.target.value)} /></label></>}
    {type === 'SMS' && <>{field('phone', t.content.phoneNumber)}{field('message', t.content.message)}</>}
    {type === 'Teléfono' && field('phone', t.content.phoneNumber, t.content.phonePlaceholder)}
  </div>
}

export function StyleControls({ language, config, update }: { language: Language; config: QRConfig; update: (patch: Partial<QRConfig>) => void }) {
  const t = getTranslations(language)
  const fileRef = useRef<HTMLInputElement>(null)
  const logo = (image: string) => update({ logo: image, ...(image ? { error: 'H' as const } : {}) })
  const dotValues = ['square', 'dots', 'rounded', 'classy', 'classy-rounded', 'extra-rounded'] as const
  const eyeValues = ['square', 'dot', 'extra-rounded'] as const
  const innerEyeValues = ['square', 'dot'] as const
  const errorValues = ['L', 'M', 'Q', 'H'] as const

  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3">
      <Select label={t.style.dotStyle} value={config.dot} options={dotValues.map(value => ({ value, label: t.style.dotOptions[value] }))} onChange={dot => update({ dot })} />
      <Select label={t.style.outerEye} value={config.eye} options={eyeValues.map(value => ({ value, label: t.style.eyeOptions[value] }))} onChange={eye => update({ eye })} />
      <Select label={t.style.innerEye} value={config.innerEye} options={innerEyeValues.map(value => ({ value, label: t.style.innerEyeOptions[value] }))} onChange={innerEye => update({ innerEye })} />
      <Select label={t.style.errorCorrection} value={config.error} options={errorValues.map(value => ({ value, label: t.style.errorOptions[value] }))} onChange={error => update({ error: error as QRConfig['error'] })} />
    </div>
    <p className="-mt-2 text-[11px] leading-relaxed text-zinc-400">{config.logo ? t.style.logoHintWith : t.style.logoHintWithout}</p>
    <div className="grid grid-cols-2 gap-3"><ColorField label={t.style.dotsColor} value={config.color} onChange={color => update({ color })} /><ColorField label={t.style.eyesColor} value={config.eyeColor} onChange={eyeColor => update({ eyeColor })} /></div>
    <div className="flex items-center justify-between"><span className={labelClass}>{t.style.fill}</span><div className="flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">{[[false, t.style.solid], [true, t.style.gradient]].map(([value, label]) => <button key={String(label)} type="button" onClick={() => update({ gradient: value as boolean })} className={`rounded-md px-3 py-1.5 text-xs font-medium ${config.gradient === value ? 'bg-white text-indigo-700 shadow-sm dark:bg-zinc-700 dark:text-indigo-300' : 'text-zinc-500'}`}>{label}</button>)}</div></div>
    {config.gradient && <div className="grid grid-cols-2 gap-3"><ColorField label={t.style.endColor} value={config.gradientEnd} onChange={gradientEnd => update({ gradientEnd })} /><Range label={t.style.angle} value={config.angle} min={0} max={360} suffix="°" onChange={angle => update({ angle })} /></div>}
    <div className="grid grid-cols-2 items-end gap-3"><ColorField label={t.style.background} value={config.background} onChange={background => update({ background })} /><label className="mb-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={config.transparent} onChange={event => update({ transparent: event.target.checked })} className="accent-indigo-600" />{t.style.transparent}</label></div>
    <div className="rounded-xl border border-dashed border-zinc-300 p-3 dark:border-zinc-700"><div className="flex items-center justify-between"><span className={labelClass}>{t.style.centralLogo}</span><button type="button" className="text-xs font-medium text-indigo-600" onClick={() => fileRef.current?.click()}><Upload size={13} className="mr-1 inline" />{t.style.uploadFile}</button></div><input ref={fileRef} hidden type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={event => { const file = event.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => logo(String(reader.result)); reader.readAsDataURL(file) } }} /><div className="flex gap-2"><Link2 size={16} className="mt-3 text-zinc-400" /><input className={inputClass} placeholder={t.style.logoUrlPlaceholder} value={config.logo.startsWith('data:') ? '' : config.logo} onChange={event => logo(event.target.value)} /></div>{config.logo && <button type="button" onClick={() => logo('')} className="mt-2 text-xs text-rose-500">{t.style.removeLogo}</button>}<div className="mt-3"><Range label={t.style.logoSize} value={config.logoSize} min={10} max={30} suffix="%" onChange={logoSize => update({ logoSize })} /></div><label className="mt-2 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300"><input type="checkbox" checked={config.hideDots} onChange={event => update({ hideDots: event.target.checked })} className="accent-indigo-600" />{t.style.hideDots}</label></div>
    <Range label={t.style.qrSize} value={config.size} min={160} max={1024} suffix=" px" onChange={size => update({ size })} />
    <Range label={t.style.margin} value={config.margin} min={0} max={40} suffix=" px" onChange={margin => update({ margin })} />
  </div>
}

export default function ControlPanel({ language, config, update, reset }: { language: Language; config: QRConfig; update: (patch: Partial<QRConfig>) => void; reset: () => void }) {
  const t = getTranslations(language)

  return <aside className="min-h-0 border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 lg:h-[calc(100vh-81px)] lg:overflow-y-auto"><div className="mx-auto max-w-2xl space-y-5 p-5 md:p-7 lg:mx-0 lg:max-w-none"><div className="flex items-center justify-between"><p className="text-[11px] font-bold uppercase tracking-[.16em] text-indigo-600">{t.panel.brand}</p><button type="button" onClick={reset} className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"><RotateCcw size={13} />{t.panel.reset}</button></div><details open className="group border-b border-zinc-100 pb-4 dark:border-zinc-800"><summary className="mb-4 flex cursor-pointer list-none items-center justify-between"><span><span className="block text-[11px] font-bold uppercase tracking-[.16em] text-indigo-600">{t.panel.contentTitle}</span><span className="mt-1 block text-xs text-zinc-400">{t.panel.contentDescription}</span></span><span aria-hidden="true" className="text-zinc-400 transition group-open:rotate-180">⌄</span></summary><ContentForm language={language} config={config} update={update} /></details><details open className="group"><summary className="mb-4 flex cursor-pointer list-none items-center justify-between"><span><span className="block text-[11px] font-bold uppercase tracking-[.16em] text-indigo-600">{t.panel.styleTitle}</span><span className="mt-1 block text-xs text-zinc-400">{t.panel.styleDescription}</span></span><span aria-hidden="true" className="text-zinc-400 transition group-open:rotate-180">⌄</span></summary><StyleControls language={language} config={config} update={update} /></details></div></aside>
}
