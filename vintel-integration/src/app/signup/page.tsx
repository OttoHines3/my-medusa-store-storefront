"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";


const formSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Valid email is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof formSchema>;

// Add type definition for error response
interface ErrorResponse {
    error?: string;
    message?: string;
}

export default function SignupPage() {
    const router = useRouter();
    const [error, setError] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
            name: "",
        },
    });

    const onSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        setError("");

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                }),
            });

            const responseData = (await response.json()) as ErrorResponse;

            if (!response.ok) {
                setError(responseData.error ?? responseData.message ?? "An error occurred during registration");
                return;
            }

            // Redirect to sign in page
            router.push("/signin");
        } catch (error) {
            console.error("Registration error:", error);
            setError("An error occurred during registration");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg px-8 py-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create your account</h1>
                </div>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Name
                        </label>
                        <input
                            {...form.register("name")}
                            id="name"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                            placeholder="Your name"
                        />
                        {form.formState.errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{form.formState.errors.name.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email
                        </label>
                        <input
                            {...form.register("email")}
                            type="email"
                            id="email"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                            placeholder="Enter your email"
                        />
                        {form.formState.errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{form.formState.errors.email.message}</p>}
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Password
                        </label>
                        <input
                            {...form.register("password")}
                            type="password"
                            id="password"
                            className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-white transition-colors"
                            placeholder="Create a password"
                        />
                        {form.formState.errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{form.formState.errors.password.message}</p>}
                    </div>
                    {error && <p className="text-red-600 dark:text-red-400 text-center">{error}</p>}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {isSubmitting ? "Creating account..." : "Sign Up"}
                    </button>
                </form>
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                    Already have an account? <a href="/signin" className="text-blue-600 dark:text-blue-400 hover:underline">Sign in</a>
                </p>
            </div>
        </div>
    );
} 