"use client"

import { Loader2 } from "lucide-react"
import { motion } from "framer-motion"

export default function OrgLoading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50">
            <motion.div
                className="flex flex-col items-center space-y-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                {/* Spinner */}
                <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />

                {/* Text */}
                <p className="text-gray-700 font-medium">
                    Loading your dashboard...
                </p>
            </motion.div>
        </div>
    )
}
