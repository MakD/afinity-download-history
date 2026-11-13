import React, { useState } from "react"
import RepoInputer from "../components/RepoInputer"
import type { NextPage } from "next"
import StarChartViewer from "../components/StarChartViewer"
import Head from "next/head"
import { SITE_URL } from "../helpers/consts"

const Index: NextPage = () => {
    const [isChartVisible, setChartVisibility] = useState(false) // Start with false since chart is not visible by default

    const metadata = {
        title: "GitHub Download History",
        description: "View and compare GitHub download history of open source projects using releases tags.",
        imageURL: `${SITE_URL}/assets/star-history-preview.webp`,
    }

    return (
        <>
            <Head>
                <title>{metadata.title}</title>
                <meta name="description" content={metadata.description} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content={SITE_URL} />
                <meta property="og:title" content={metadata.title} />
                <meta property="og:description" content={metadata.description} />
                <meta property="og:image" content={metadata.imageURL} />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={SITE_URL} />
                <meta name="twitter:title" content={metadata.title} />
                <meta name="twitter:description" content={metadata.description} />
                <meta name="twitter:image" content={metadata.imageURL} />
            </Head>
            <div className="relative w-full h-auto min-h-screen flex flex-col overflow-x-hidden">
                <div className="w-full h-auto grow flex flex-row justify-center">
                    <div className="w-full px-4 h-auto grow">
                        <div className="w-full flex flex-col justify-start">
                            <div className="hidden">
                                <RepoInputer isChartVisible={isChartVisible} setChartVisibility={setChartVisibility} />
                            </div>
                            {isChartVisible && <StarChartViewer />}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Index
