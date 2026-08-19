import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

import { ApplicationForm } from '@/components/admissions/application-form'
import { COLLEGE } from '@/content/college'

export const metadata: Metadata = {
  title: 'Apply for admission',
  description: `Apply to ${COLLEGE.name}. Submit your details and documents online.`,
}

export default function ApplyPage() {
  return (
    <div className="section">
      <div className="container max-w-2xl">
        <Link
          href="/admissions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to admissions
        </Link>

        <div className="mt-6">
          <span className="eyebrow">
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Admissions {new Date().getFullYear()}
          </span>
          <h1 className="heading-lg mt-5">Apply to {COLLEGE.short}</h1>
          <p className="lede mt-4">
            Fill this in and the admissions office will be in touch. You will get an
            application number to quote when you call.
          </p>
        </div>

        <div className="mt-12">
          <ApplicationForm />
        </div>
      </div>
    </div>
  )
}
