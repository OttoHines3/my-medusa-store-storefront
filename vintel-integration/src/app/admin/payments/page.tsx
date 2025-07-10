"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select"
import { Check, DollarSign, RefreshCw, X, AlertCircle } from "lucide-react"
import { api } from "~/trpc/react"

export default function AdminPaymentsPage() {
    const [paymentId, setPaymentId] = useState("")
    const [paymentAmount, setPaymentAmount] = useState("")
    const [paymentMode, setPaymentMode] = useState<string>("")
    const [paymentDescription, setPaymentDescription] = useState("")
    const [refundAmount, setRefundAmount] = useState("")
    const [refundReason, setRefundReason] = useState("")
    const [loading, setLoading] = useState(false)

    const paymentQuery = api.checkout.getPayment.useQuery(
        { paymentId },
        { enabled: !!paymentId }
    )

    const recordPayment = api.checkout.recordPayment.useMutation()
    const refundPayment = api.checkout.refundPayment.useMutation()

    const handleRecordPayment = async () => {
        if (!paymentId || !paymentAmount || !paymentMode) return

        setLoading(true)
        try {
            await recordPayment.mutateAsync({
                invoiceId: paymentId,
                amount: parseFloat(paymentAmount),
                paymentMode,
                description: paymentDescription || undefined,
            })

            // Refresh payment status
            await paymentQuery.refetch()
            setPaymentAmount("")
            setPaymentMode("")
            setPaymentDescription("")
        } catch (error) {
            console.error("Payment recording failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleRefund = async () => {
        if (!paymentId) return

        setLoading(true)
        try {
            const amount = refundAmount ? parseFloat(refundAmount) : undefined
            await refundPayment.mutateAsync({
                paymentId,
                amount,
                reason: refundReason || undefined,
            })

            // Refresh payment status
            await paymentQuery.refetch()
            setRefundAmount("")
            setRefundReason("")
        } catch (error) {
            console.error("Refund failed:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount)
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Management</h1>
                    <p className="text-gray-600">Manage payments, refunds, and monitor payment status</p>
                </div>

                <div className="grid gap-6">
                    {/* Payment Lookup */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Payment Lookup
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <Label htmlFor="paymentId">Payment ID</Label>
                                    <Input
                                        id="paymentId"
                                        placeholder="Enter payment ID"
                                        value={paymentId}
                                        onChange={(e) => setPaymentId(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button
                                        onClick={() => paymentQuery.refetch()}
                                        disabled={!paymentId}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Lookup
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Status */}
                    {paymentQuery.data && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Payment Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Status:</span>
                                            <span className="font-semibold text-green-600">
                                                Paid
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount:</span>
                                            <span className="font-semibold">{formatAmount(paymentQuery.data.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Payment Mode:</span>
                                            <span className="font-semibold">{paymentQuery.data.payment_mode}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Invoice ID:</span>
                                            <span className="font-semibold">{paymentQuery.data.invoice_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Customer ID:</span>
                                            <span className="font-semibold">{paymentQuery.data.customer_id}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Created:</span>
                                            <span className="font-semibold">
                                                {new Date(paymentQuery.data.date).toLocaleString()}
                                            </span>
                                        </div>
                                        {paymentQuery.data.description && (
                                            <div className="pt-2 border-t">
                                                <div className="text-sm text-gray-600 mb-1">Description:</div>
                                                <div className="text-sm">
                                                    {paymentQuery.data.description}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Payment Actions */}
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Record Payment */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Check className="h-5 w-5" />
                                    Record Payment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="paymentAmount">Amount (USD)</Label>
                                    <Input
                                        id="paymentAmount"
                                        type="number"
                                        placeholder="99.00"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="paymentMode">Payment Mode</Label>
                                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                                        <SelectTrigger id="paymentMode">
                                            <SelectValue placeholder="Select payment mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                            <SelectItem value="credit_card">Credit Card</SelectItem>
                                            <SelectItem value="cash">Cash</SelectItem>
                                            <SelectItem value="check">Check</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="paymentDescription">Description (Optional)</Label>
                                    <Input
                                        id="paymentDescription"
                                        placeholder="Add payment details"
                                        value={paymentDescription}
                                        onChange={(e) => setPaymentDescription(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    onClick={handleRecordPayment}
                                    disabled={loading || !paymentId || !paymentAmount || !paymentMode}
                                >
                                    {loading ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <Check className="h-4 w-4 mr-2" />
                                            Record Payment
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Refund */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <X className="h-5 w-5" />
                                    Issue Refund
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="refundAmount">Amount (Optional)</Label>
                                    <Input
                                        id="refundAmount"
                                        type="number"
                                        placeholder="Leave empty for full refund"
                                        value={refundAmount}
                                        onChange={(e) => setRefundAmount(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="refundReason">Reason (Optional)</Label>
                                    <Input
                                        id="refundReason"
                                        placeholder="Reason for refund"
                                        value={refundReason}
                                        onChange={(e) => setRefundReason(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full"
                                    variant="destructive"
                                    onClick={handleRefund}
                                    disabled={loading || !paymentId}
                                >
                                    {loading ? (
                                        <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <AlertCircle className="h-4 w-4 mr-2" />
                                            Issue Refund
                                        </>
                                    )}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
} 