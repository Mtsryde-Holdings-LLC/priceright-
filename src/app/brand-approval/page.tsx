/**
 * Brand Approval Center Page
 * One-spot form for submitting brand approval requests to all marketplaces
 */

'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'

const MARKETPLACES = [
  'AMAZON',
  'WALMART',
  'FACEBOOK',
  'TIKTOK',
  'WHATSAPP',
  'SHOPIFY',
  'WOOCOMMERCE',
]

const FILE_TYPES = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'TRADEMARK', label: 'Trademark Certificate' },
  { value: 'LICENSE', label: 'License Agreement' },
  { value: 'AUTHORIZATION_LETTER', label: 'Authorization Letter' },
  { value: 'OTHER', label: 'Other' },
]

export default function BrandApprovalPage() {
  const [formData, setFormData] = useState({
    brandName: '',
    targetMarketplaces: [] as string[],
    notes: '',
  })
  const [files, setFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/brand-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          files,
        }),
      })

      if (response.ok) {
        alert('Brand approval request submitted successfully!')
        // Reset form
        setFormData({ brandName: '', targetMarketplaces: [], notes: '' })
        setFiles([])
      } else {
        alert('Failed to submit request')
      }
    } catch (error) {
      console.error('Submission error:', error)
      alert('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const toggleMarketplace = (marketplace: string) => {
    setFormData(prev => ({
      ...prev,
      targetMarketplaces: prev.targetMarketplaces.includes(marketplace)
        ? prev.targetMarketplaces.filter(m => m !== marketplace)
        : [...prev.targetMarketplaces, marketplace],
    }))
  }

  const addFile = () => {
    setFiles([...files, { fileType: 'INVOICE', fileName: '', fileUrl: '' }])
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Approval Center</h1>
          <p className="mt-1 text-sm text-gray-600">
            Submit brand approval documents to multiple marketplaces in one place
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Name */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Brand Information
            </h2>
            <div>
              <label htmlFor="brandName" className="label">
                Brand Name *
              </label>
              <input
                id="brandName"
                type="text"
                required
                className="input"
                placeholder="Enter brand name"
                value={formData.brandName}
                onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
              />
            </div>
          </div>

          {/* Target Marketplaces */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Target Marketplaces *
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Select the marketplaces where you want to apply for brand approval
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {MARKETPLACES.map((marketplace) => (
                <button
                  key={marketplace}
                  type="button"
                  onClick={() => toggleMarketplace(marketplace)}
                  className={`p-4 border-2 rounded-lg transition-colors ${
                    formData.targetMarketplaces.includes(marketplace)
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {marketplace}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* File Uploads */}
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Supporting Documents
              </h2>
              <button
                type="button"
                onClick={addFile}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add File
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload invoices, trademark certificates, and other proof of brand ownership
            </p>

            {files.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No files added yet</p>
                <button
                  type="button"
                  onClick={addFile}
                  className="mt-2 text-primary-600 hover:text-primary-700"
                >
                  Add your first file
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {files.map((file, index) => (
                  <div key={index} className="flex gap-3 items-start p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="label">File Type</label>
                        <select
                          className="input"
                          value={file.fileType}
                          onChange={(e) => {
                            const newFiles = [...files]
                            newFiles[index].fileType = e.target.value
                            setFiles(newFiles)
                          }}
                        >
                          {FILE_TYPES.map(type => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="label">File Name</label>
                        <input
                          type="text"
                          className="input"
                          placeholder="invoice.pdf"
                          value={file.fileName}
                          onChange={(e) => {
                            const newFiles = [...files]
                            newFiles[index].fileName = e.target.value
                            setFiles(newFiles)
                          }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="text-red-600 hover:text-red-700 mt-7"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <label htmlFor="notes" className="label">
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              className="input"
              placeholder="Any additional information for the review team..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary">
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading || formData.targetMarketplaces.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit for Approval'}
            </button>
          </div>
        </form>

        {/* Recent Requests */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Requests
          </h2>
          <div className="text-center py-8 text-gray-500">
            No previous requests
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
