import Link from "next/link"
import {projects} from "@/lib/projectData"
import {getProjectStatus} from "@/lib/utils"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {ExternalLink} from "lucide-react"
import {ProjectPreview} from "@/components/project-preview"
import {StatusBadge} from "@/components/status-badge"

export default async function DashboardPage() {
    // Process projects serially to avoid overwhelming the single DB connection
    const projectStatuses = []
    for (const project of projects) {
        const status = await getProjectStatus(project.slug, project.routes)
        projectStatuses.push({
            ...project,
            status,
        })
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-6">
                    <h1 className="text-3xl font-bold text-foreground">Website Monitoring Dashboard</h1>
                    <p className="text-muted-foreground mt-2">Monitor uptime and performance across all your
                        projects</p>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="grid gap-6 grid-cols-1">
                    {projectStatuses.map(({status, ...project}) => (
                        <Link
                            key={project.slug}
                            href={`/${project.slug}`}
                            className="group transition-transform hover:scale-[1.02]"
                        >
                            <Card className="h-full overflow-hidden border-2 transition-colors hover:border-primary">
                                <ProjectPreview
                                    url={project.visitLink}
                                    title={project.title}
                                    renderUrl={project.renderUrl}
                                />

                                <CardHeader>
                                    <div className="flex items-start justify-between gap-2">
                                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                            {project.title}
                                        </CardTitle>
                                        <StatusBadge status={status.overallStatus}/>
                                    </div>
                                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                                </CardHeader>

                                <CardContent>
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <ExternalLink className="h-4 w-4"/>
                                            <span className="truncate">{project.visitLink}</span>
                                        </div>
                                        <Badge variant="secondary" className="shrink-0">
                                            {project.routes.length} routes
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>

                {projects.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <div className="text-6xl opacity-20 mb-4">📊</div>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">No Projects Yet</h2>
                        <p className="text-muted-foreground max-w-md">
                            Add your first project to start monitoring website uptime and performance.
                        </p>
                    </div>
                )}
            </main>
        </div>
    )
}
