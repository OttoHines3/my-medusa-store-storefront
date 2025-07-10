"use client"

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { api } from "~/trpc/react"
import type { ZohoNote } from "~/types/zoho"

export default function DashboardPage() {
    const { data: sessionsData, isLoading: sessionsLoading } = api.checkout.getUserSessions.useQuery()
    const { data: companyData, isLoading: companyLoading } = api.companyInfo.getByUser.useQuery()
    const { data: zohoContactData, isLoading: zohoLoading } = api.zoho.getContactInfo.useQuery({
        userId: undefined,
    })

    const { data: crmData, isLoading: crmLoading } = api.zoho.getCRMData.useQuery({
        zohoContactId: zohoContactData?.data?.zohoLink?.zohoUserId ?? "",
        includeSalesOrders: true,
        includeDeals: true,
        includeTasks: true,
        includeNotes: true,
    }, {
        enabled: !!zohoContactData?.data?.zohoLink?.zohoUserId,
    })

    const formatDate = (date: string | Date | undefined | null) => {
        if (!date) return "Unknown date"
        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date
            return dateObj.toLocaleDateString()
        } catch (error) {
            console.error("Error formatting date:", error)
            return "Invalid date"
        }
    }

    const formatNoteDate = (note: ZohoNote) => {
        return note.Created_Time ? formatDate(note.Created_Time) : "No date"
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "payment_completed":
                return "bg-blue-100 text-blue-800"
            case "agreement_completed":
                return "bg-purple-100 text-purple-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    const getAgreementStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-green-100 text-green-800"
            case "pending":
                return "bg-yellow-100 text-yellow-800"
            case "sent":
                return "bg-blue-100 text-blue-800"
            case "partially_signed":
                return "bg-orange-100 text-orange-800"
            case "declined":
                return "bg-red-100 text-red-800"
            case "voided":
                return "bg-gray-100 text-gray-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    if (sessionsLoading || companyLoading || zohoLoading || crmLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto py-8">
                <div className="grid grid-cols-1 gap-6">
                    {/* Sessions Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Sessions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {sessionsData?.data.length === 0 ? (
                                <p className="text-gray-600">No sessions found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {sessionsData?.data.map((session) => (
                                        <div key={session.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold">
                                                    {session.module ?? "Zoho Integration"}
                                                </h3>
                                                <Badge className={getStatusColor(session.status)}>
                                                    {session.status}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-gray-600">
                                                Created: {formatDate(session.createdAt)}
                                            </div>
                                            {session.agreement && (
                                                <div className="mt-2">
                                                    <Badge className={getAgreementStatusColor(session.agreement.status)}>
                                                        Agreement: {session.agreement.status}
                                                    </Badge>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Company Info Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {companyData?.data.length === 0 ? (
                                <p className="text-gray-600">No company information found.</p>
                            ) : (
                                <div className="space-y-4">
                                    {companyData?.data.map((info) => (
                                        <div key={info.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="text-lg font-semibold">{info.companyName}</h3>
                                                <Badge className={getStatusColor(info.checkoutSession.status)}>
                                                    {info.checkoutSession.status}
                                                </Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Contact Name:</p>
                                                    <p>{info.contactName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Email:</p>
                                                    <p>{info.email ?? "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Phone:</p>
                                                    <p>{info.phone ?? "N/A"}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Industry:</p>
                                                    <p>{info.industry ?? "N/A"}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* CRM Data Section */}
                    {crmData?.data && (
                        <Card>
                            <CardHeader>
                                <CardTitle>CRM Data</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-6">
                                    {/* Sales Orders */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Sales Orders</h3>
                                        {crmData.data.salesOrders?.length === 0 ? (
                                            <p className="text-gray-600">No sales orders found.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {crmData.data.salesOrders?.map((order) => (
                                                    <div key={order.id} className="border rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <span>{order.Subject ?? "Untitled Order"}</span>
                                                            <Badge>{order.Status ?? "Unknown"}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Deals */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Deals</h3>
                                        {crmData.data.deals?.length === 0 ? (
                                            <p className="text-gray-600">No deals found.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {crmData.data.deals?.map((deal) => (
                                                    <div key={deal.id} className="border rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <span>{deal.Deal_Name ?? "Untitled Deal"}</span>
                                                            <Badge>{deal.Stage ?? "Unknown"}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tasks */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Tasks</h3>
                                        {crmData.data.tasks?.length === 0 ? (
                                            <p className="text-gray-600">No tasks found.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {crmData.data.tasks?.map((task) => (
                                                    <div key={task.id} className="border rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <span>{task.Subject ?? "Untitled Task"}</span>
                                                            <Badge>{task.Status ?? "Unknown"}</Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Notes</h3>
                                        {crmData.data.notes?.length === 0 ? (
                                            <p className="text-gray-600">No notes found.</p>
                                        ) : (
                                            <div className="space-y-2">
                                                {crmData.data.notes?.map((note) => (
                                                    <div key={note.id} className="border rounded-lg p-3">
                                                        <div className="flex items-center justify-between">
                                                            <span>{note.Note_Title ?? "Untitled Note"}</span>
                                                            <span className="text-sm text-gray-600">
                                                                {formatNoteDate(note)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
} 