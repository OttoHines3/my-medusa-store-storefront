"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { User, DollarSign, Building, Clock, ExternalLink, AlertCircle } from "lucide-react"
import type { ZohoContact, ZohoSalesOrder, ZohoDeal, ZohoTask, ZohoNote, APIResponse } from "~/types/zoho"

interface CRMDataResponse {
    contact: ZohoContact | null;
    salesOrders: ZohoSalesOrder[];
    deals: ZohoDeal[];
    tasks: ZohoTask[];
    notes: ZohoNote[];
}

export default function MagicLinkPage() {
    const params = useParams()
    const zohoId = params.zohoId as string
    const loginCode = params.loginCode as string
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [crmData, setCrmData] = useState<CRMDataResponse | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`/api/zoho/magic-link/${zohoId}/${loginCode}`)
                const data = await response.json() as APIResponse<CRMDataResponse>

                if (!data.success) {
                    setError(data.message ?? "Failed to fetch CRM data")
                    return
                }

                setCrmData(data.data)
            } catch (err) {
                setError((err as Error)?.message ?? "An error occurred")
            } finally {
                setLoading(false)
            }
        }

        void fetchData()
    }, [zohoId, loginCode])

    const formatDate = (date: string | Date) => {
        const dateObj = typeof date === 'string' ? new Date(date) : date
        return dateObj.toLocaleDateString()
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your CRM data...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                        <p className="text-gray-600 mb-4">{error}</p>
                        <Button onClick={() => window.location.href = "/"}>
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!crmData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="max-w-md w-full">
                    <CardContent className="p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Available</h3>
                        <p className="text-gray-600 mb-4">No CRM data found for this link.</p>
                        <Button onClick={() => window.location.href = "/"}>
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-gray-900">Your CRM Data</h1>
                    <p className="text-gray-600 mt-2">Welcome back! Here&apos;s your latest information.</p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid gap-6">
                    {/* Contact Information */}
                    {crmData?.contact && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-blue-600" />
                                    Contact Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600">Name</p>
                                        <p className="font-medium">
                                            {crmData.contact.First_Name ?? ""} {crmData.contact.Last_Name ?? ""}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Email</p>
                                        <p className="font-medium">{crmData.contact.Email ?? "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Phone</p>
                                        <p className="font-medium">{crmData.contact.Phone ?? "N/A"}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Company</p>
                                        <p className="font-medium">{crmData.contact.Company ?? "N/A"}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Sales Orders */}
                    {crmData?.salesOrders && crmData.salesOrders.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Sales Orders ({crmData.salesOrders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.salesOrders.map((order) => (
                                        <div key={order.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{order.Subject ?? "Untitled Order"}</p>
                                                    <p className="text-sm text-gray-600">{order.Status ?? "Unknown"}</p>
                                                </div>
                                                <Badge className="bg-green-100 text-green-800">
                                                    ${order.Grand_Total ?? 0}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Deals */}
                    {crmData?.deals && crmData.deals.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building className="h-5 w-5 text-purple-600" />
                                    Deals ({crmData.deals.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.deals.map((deal) => (
                                        <div key={deal.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{deal.Deal_Name ?? "Untitled Deal"}</p>
                                                    <p className="text-sm text-gray-600">{deal.Stage ?? "Unknown"}</p>
                                                </div>
                                                <Badge className="bg-purple-100 text-purple-800">
                                                    ${deal.Amount ?? 0}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tasks */}
                    {crmData?.tasks && crmData.tasks.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    Tasks ({crmData.tasks.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.tasks.map((task) => (
                                        <div key={task.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{task.Subject ?? "Untitled Task"}</p>
                                                    <p className="text-sm text-gray-600">{task.Status ?? "Unknown"}</p>
                                                </div>
                                                <Badge className="bg-orange-100 text-orange-800">
                                                    {task.Priority ?? "Normal"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Notes */}
                    {crmData?.notes && crmData.notes.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-blue-600" />
                                    Notes ({crmData.notes.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {crmData.notes.map((note) => (
                                        <div key={note.id} className="border rounded-lg p-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="font-medium">{note.Note_Title ?? "Untitled Note"}</p>
                                                    <p className="text-sm text-gray-600">
                                                        {note.Created_Time ? formatDate(note.Created_Time) : "Unknown date"}
                                                    </p>
                                                </div>
                                            </div>
                                            {note.Note_Content && (
                                                <p className="mt-2 text-gray-600">{note.Note_Content}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Buttons */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => window.open("https://crm.zoho.com/crm/", "_blank")}
                                    className="flex-1"
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Zoho CRM
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = "/"}
                                    className="flex-1"
                                >
                                    Return Home
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
} 