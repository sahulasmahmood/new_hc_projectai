"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Stethoscope, Download, Receipt, IndianRupee } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import api from "@/lib/api"

interface PrescriptionViewModalProps {
  prescription: {
    id: number
    createdAt: string
    chiefComplaint?: string
    investigations?: string
    doctorNotes?: string
    advice?: string
    doctorName: string
    doctorQualification?: string
    doctorRegistrationNumber?: string
    doctorSignature?: string
    // Direct patient fields (stored in prescription)
    patientName?: string
    patientVisibleId?: string
    patientAge?: number
    patientGender?: string
    medications: Array<{
      id: number
      medicineName: string
      dosage: string
      frequency: string
      timing?: string
      duration: string
    }>
    // Keep old patient relation for backward compatibility
    patient?: {
      name: string
      visibleId: string
      age: number
      gender: string
    }
    appointment?: {
      date: string
      time: string
      type: string
    }
  }
  onClose: () => void
}

// Helper function to format timing display
const formatTiming = (timing?: string) => {
  if (!timing) return 'No meal restriction';
  
  const timingMap: Record<string, string> = {
    'AC': 'Before meals (AC)',
    'PC': 'After meals (PC)',
    'HS': 'At bedtime (HS)',
    'Empty stomach': 'Empty stomach',
    'With food': 'With food',
    'No meal restriction': 'No meal restriction'
  };
  
  return timingMap[timing] || timing;
};

const PrescriptionViewModal = ({ prescription, onClose }: PrescriptionViewModalProps) => {
  const [hospitalInfo, setHospitalInfo] = useState<{
    name?: string
    phone?: string
    license?: string
    address?: string
  } | null>(null)
  const [loadingHospitalInfo, setLoadingHospitalInfo] = useState(true)
  const [isGeneratingBill, setIsGeneratingBill] = useState(false)
  const [existingBill, setExistingBill] = useState<{
    id: number;
    billNumber: string;
    totalAmount: number;
    prescriptionId: number;
  } | null>(null)
  const [checkingBill, setCheckingBill] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchHospitalInfo = async () => {
      try {
        const response = await api.get("/settings/hospital-settings")
        setHospitalInfo(response.data)
      } catch (error) {
        console.error("Error fetching hospital settings:", error)
        setHospitalInfo({
          name: "MEDICAL CLINIC",
          phone: "Emergency: Not Configured",
          license: "Please configure in Hospital Settings",
        })
      } finally {
        setLoadingHospitalInfo(false)
      }
    }

    fetchHospitalInfo()
  }, [])

  useEffect(() => {
    const checkExistingBill = async () => {
      try {
        setCheckingBill(true)
        const response = await api.get(`/billing?prescriptionId=${prescription.id}&_t=${Date.now()}`)
        
        // Handle both array response and paginated response
        let bills = []
        if (response.data.bills) {
          bills = response.data.bills
        } else if (Array.isArray(response.data)) {
          bills = response.data
        }
        
        if (bills && bills.length > 0) {
          const prescriptionBill = bills.find((bill) => bill.prescriptionId === prescription.id)
          setExistingBill(prescriptionBill || null)
        } else {
          setExistingBill(null)
        }
      } catch (error) {
        console.error("Error checking existing bill:", error)
        setExistingBill(null)
      } finally {
        setCheckingBill(false)
      }
    }

    checkExistingBill()
  }, [prescription.id])

  const handleGenerateBill = async () => {
    try {
      setIsGeneratingBill(true)
      const response = await api.post("/billing/create-from-prescription", {
        prescriptionId: prescription.id,
      })

      const { autoAddedItems } = response.data
      let description = `Bill ${response.data.billNumber} has been created successfully.`
      
      if (autoAddedItems) {
        const addedItems = []
        if (autoAddedItems.consultationFee) {
          addedItems.push("consultation fee")
        }
        if (autoAddedItems.medicines > 0) {
          addedItems.push(`${autoAddedItems.medicines} medicine${autoAddedItems.medicines > 1 ? 's' : ''}`)
        }
        
        if (addedItems.length > 0) {
          description += ` Auto-added: ${addedItems.join(" and ")}.`
        }
      }

      toast({
        title: "Bill Generated",
        description,
      })

      setExistingBill(response.data)
    } catch (error: Error | unknown) {
      console.error("Error generating bill:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate bill"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingBill(false)
    }
  }

  const handleDownload = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${prescription.patientName || prescription.patient?.name || "Patient"}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: white; color: black; }
            .prescription { max-width: 800px; margin: 0 auto; border: 2px solid #000; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; font-size: 24px; font-weight: bold; }
            .patient-info { display: flex; justify-content: space-between; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid #ccc; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
            .medications-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            .medications-table th, .medications-table td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
            .medications-table th { background-color: #f5f5f5; font-weight: bold; }
            .signature-section { display: flex; justify-content: space-between; align-items: end; margin-top: 30px; padding-top: 15px; border-top: 1px solid #000; }
            .signature img { max-height: 60px; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="prescription">
            <div class="header">
              <h1>${hospitalInfo?.name?.toUpperCase() || "MEDICAL CLINIC"}</h1>
              ${hospitalInfo?.phone ? `<p>Emergency: ${hospitalInfo.phone}</p>` : ""}
            </div>
            <div class="patient-info">
              <div>
                <div style="margin-bottom: 8px;"><strong>Patient:</strong> ${prescription.patientName || prescription.patient?.name || "N/A"}</div>
                <div style="margin-bottom: 4px;"><strong>ID:</strong> ${prescription.patientVisibleId || prescription.patient?.visibleId || "N/A"}</div>
                <div><strong>Age & Gender:</strong> ${prescription.patientAge || prescription.patient?.age || "N/A"} years • ${prescription.patientGender || prescription.patient?.gender || "N/A"}</div>
              </div>
              <div>
                <div style="margin-bottom: 4px;"><strong>Date:</strong> ${formatDate(prescription.createdAt)}</div>
                <div style="margin-bottom: 4px;"><strong>Doctor:</strong> Dr. ${prescription.doctorName}${prescription.doctorQualification ? `, ${prescription.doctorQualification}` : ""}</div>
                ${prescription.doctorRegistrationNumber ? `<div><strong>Reg. No:</strong> ${prescription.doctorRegistrationNumber}</div>` : ""}
              </div>
            </div>
            ${prescription.chiefComplaint ? `<div class="section"><div class="section-title">Chief Complaints & Diagnosis:</div><p>${prescription.chiefComplaint}</p></div>` : ""}
            <div class="section">
              <div class="section-title">Medications:</div>
              ${
                prescription.medications && prescription.medications.length > 0
                  ? `
                <table class="medications-table">
                  <thead><tr><th>Medicine Name</th><th>Dosage</th><th>Frequency</th><th>Timing</th><th>Duration</th></tr></thead>
                  <tbody>${(prescription.medications || []).map((med) => `<tr><td>${med.medicineName}</td><td>${med.dosage}</td><td>${med.frequency}</td><td>${formatTiming(med.timing)}</td><td>${med.duration}</td></tr>`).join("")}</tbody>
                </table>`
                  : "<p>No medications prescribed</p>"
              }
            </div>
            ${prescription.investigations ? `<div class="section"><div class="section-title">Investigations:</div><p>${prescription.investigations}</p></div>` : ""}
            ${prescription.doctorNotes ? `<div class="section"><div class="section-title">Doctor Notes:</div><p>${prescription.doctorNotes}</p></div>` : ""}
            ${prescription.advice ? `<div class="section"><div class="section-title">Advice:</div><p>${prescription.advice}</p></div>` : ""}
            <div class="signature-section" style="justify-content: flex-end;">
              <div style="text-align: center;">
                <div style="font-size: 12px; margin-bottom: 5px; font-weight: bold;">Doctor's Signature</div>
                ${
                  prescription.doctorSignature && prescription.doctorSignature.startsWith("data:image")
                    ? `<img src="${prescription.doctorSignature}" alt="Doctor Signature" style="max-height: 60px; max-width: 150px; border: 1px solid #ccc; margin-bottom: 5px;" />`
                    : `<div style="height: 40px; border-bottom: 1px solid #000; width: 150px; margin: 0 auto 5px auto;"></div>`
                }
                <div style="font-weight: bold; font-size: 14px;">Dr. ${prescription.doctorName}${prescription.doctorQualification ? `, ${prescription.doctorQualification}` : ""}</div>
                ${prescription.doctorRegistrationNumber ? `<div style="font-size: 10px; margin-top: 2px; color: #666;">Reg. No: ${prescription.doctorRegistrationNumber}</div>` : ""}
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `Prescription_${prescription.patientName || prescription.patient?.name || "Patient"}_${formatDate(prescription.createdAt)}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleViewBill = () => {
    if (existingBill) {
      // Close the prescription modal first
      onClose()
      // Navigate to billing page
      navigate('/billing', { 
        state: { 
          selectedBillId: existingBill.id,
          billNumber: existingBill.billNumber 
        } 
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
  }

  return (
    <>
      <style>{`
        @media print {
          .print-hidden { display: none !important; }
          .prescription-content { 
            background: white !important; 
            color: black !important;
            font-size: 12px !important;
          }
          .prescription-content .border-gray-300 { border-color: #000 !important; }
          .prescription-content .text-gray-600 { color: #333 !important; }
          .prescription-content .bg-gray-50 { background: #f9f9f9 !important; }
        }
      `}</style>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto prescription-content">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-medical-500" />
                Prescription Details
              </DialogTitle>
              <div className="flex gap-2">
                {existingBill ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewBill}
                    className="flex items-center gap-2 bg-transparent"
                    disabled={checkingBill}
                  >
                    <Receipt className="h-4 w-4" />
                    View Bill ({existingBill.billNumber})
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateBill}
                    disabled={isGeneratingBill || checkingBill}
                    className="flex items-center gap-2 bg-transparent"
                  >
                    <IndianRupee className="h-4 w-4" />
                    {isGeneratingBill ? "Generating..." : "Generate Bill"}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              </div>
            </div>
          </DialogHeader>

          {existingBill && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Bill Generated: {existingBill.billNumber}</span>
                </div>
                <div className="text-sm text-green-600">
                  Amount: ₹{existingBill.totalAmount?.toLocaleString() || "0"}
                </div>
              </div>
            </div>
          )}

          {checkingBill && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm text-blue-800">Checking for existing bill...</span>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            <Card className="border-2 border-gray-300">
              <CardContent className="p-8">
              {/* Hospital Header */}
                <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
                  {loadingHospitalInfo ? (
                    <div className="animate-pulse">
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    </div>
                  ) : (
                    <>
                      <h1 className="text-xl font-bold text-gray-900 mb-1">
                        {hospitalInfo?.name?.toUpperCase() || "MEDICAL CLINIC"}
                      </h1>
                      <div className="text-xs text-gray-600">
                        <div className="flex flex-wrap justify-center gap-2">
                          {hospitalInfo?.phone && <span>Emergency: {hospitalInfo.phone}</span>}
                          {!hospitalInfo?.phone && (
                            <span className="text-orange-600">Please configure Hospital Information in Settings</span>
                          )}
                        </div>
                        {hospitalInfo?.address && (
                          <div className="mt-1 text-xs text-gray-500">{hospitalInfo.address}</div>
                        )}
                      </div>
                    </>
                  )}
                </div>

              {/* Patient Info */}
                <div className="flex items-start justify-between mb-6 pb-3 border-b border-gray-200">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold mb-3">
                      Patient: {prescription.patientName || prescription.patient?.name || "Patient information not available"}
                    </h2>
                    <div className="space-y-1">
                      {prescription.patientName || prescription.patient ? (
                        <>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">ID:</span> {prescription.patientVisibleId || prescription.patient?.visibleId}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Age & Gender:</span> {prescription.patientAge || prescription.patient?.age} years • {prescription.patientGender || prescription.patient?.gender}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-orange-600">
                          Patient details not loaded - please refresh or contact support
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600 mb-1"><span className="font-medium">Date:</span> {formatDate(prescription.createdAt)}</p>
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Doctor:</span> Dr. {prescription.doctorName}
                      {prescription.doctorQualification && `, ${prescription.doctorQualification}`}
                    </p>
                    {prescription.doctorRegistrationNumber && (
                      <p className="text-sm text-gray-600"><span className="font-medium">Reg. No:</span> {prescription.doctorRegistrationNumber}</p>
                    )}
                  </div>
                </div>

              {/* Form Sections - Compact Layout */}
                <div className="space-y-4">
                {/* Chief Complaints & Diagnosis */}
                  {prescription.chiefComplaint && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Chief Complaints & Diagnosis:
                      </label>
                      <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">
                        {prescription.chiefComplaint}
                      </div>
                    </div>
                  )}

                {/* Medication */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Medication:</label>

                    {prescription.medications && prescription.medications.length > 0 ? (
                      <div className="border border-gray-300 rounded">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Medicine Name</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Dosage</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Frequency</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Timing</th>
                              <th className="px-2 py-1 text-left text-xs font-medium text-gray-700">Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(prescription.medications || []).map((med) => (
                              <tr key={med.id} className="border-t border-gray-200">
                                <td className="px-2 py-1 text-sm">{med.medicineName}</td>
                                <td className="px-2 py-1 text-sm">{med.dosage}</td>
                                <td className="px-2 py-1 text-sm">{med.frequency}</td>
                                <td className="px-2 py-1 text-sm">{formatTiming(med.timing)}</td>
                                <td className="px-2 py-1 text-sm">{med.duration}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm text-gray-500">
                        No medications prescribed
                      </div>
                    )}
                  </div>

                {/* Two Column Layout for remaining sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Investigations / Lab Tests */}
                    {prescription.investigations && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Investigations / Lab Tests:
                        </label>
                        <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">
                          {prescription.investigations}
                        </div>
                      </div>
                    )}

                  {/* Doctor Notes */}
                    {prescription.doctorNotes && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Notes:</label>
                        <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">
                          {prescription.doctorNotes}
                        </div>
                      </div>
                    )}
                  </div>

                {/* Advice & Follow-Up */}
                  {prescription.advice && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Advice & Follow-Up:</label>
                      <div className="p-2 border border-gray-300 rounded bg-gray-50 text-sm">{prescription.advice}</div>
                    </div>
                  )}
                </div>

                {/* Doctor Signature Section */}
                <div className="flex justify-end items-end mt-6 pt-4 border-t border-gray-300">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-700 mb-2">Doctor's Signature</div>
                    {prescription.doctorSignature && prescription.doctorSignature.startsWith("data:image") ? (
                      <div className="space-y-2">
                        <img
                          src={prescription.doctorSignature}
                          alt="Doctor Signature"
                          className="h-16 max-w-32 border border-gray-200 bg-white rounded mx-auto"
                        />
                        <div className="text-xs text-green-600">✓ Verified Digital Signature</div>
                      </div>
                    ) : (
                      <div className="w-32 h-12 border-b border-gray-400 mb-2 mx-auto"></div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default PrescriptionViewModal
