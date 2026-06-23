import { AppLayout } from "@/components/layout/AppLayout";
import { useListActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityItemType } from "@workspace/api-client-react/src/generated/api.schemas";
import { Shield, FileText, CheckCircle, Scale, Activity, Clock } from "lucide-react";

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  submission: {
    icon: <FileText className="w-4 h-4" />,
    label: "Submission",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  dispute: {
    icon: <Scale className="w-4 h-4" />,
    label: "Dispute",
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  analysis: {
    icon: <Activity className="w-4 h-4" />,
    label: "Analysis",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  template: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Template",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

function getConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Shield className="w-4 h-4" />,
    label: type,
    color: "bg-secondary text-secondary-foreground border-border",
  };
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function AdminActivity() {
  const { data: activity = [], isLoading } = useListActivity({ limit: 100 });

  const grouped = activity.reduce<Record<string, typeof activity>>((acc, item) => {
    const date = new Date(item.createdAt).toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <AppLayout
      title="Audit Log"
      subtitle="Complete chronological record of all system events"
      role="admin"
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Summary sidebar */}
        <div className="lg:w-64 shrink-0 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Event Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(TYPE_CONFIG).map(([type, cfg]) => {
                const count = activity.filter((a) => a.type === type).length;
                return (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`p-1 rounded border ${cfg.color}`}>{cfg.icon}</span>
                      <span className="font-medium">{cfg.label}</span>
                    </div>
                    <Badge variant="secondary" className="font-mono">{count}</Badge>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-border flex items-center justify-between text-sm font-medium">
                <span>Total</span>
                <Badge className="font-mono">{activity.length}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Showing last 100 events</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Event feed */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-secondary/50 shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-secondary/50 rounded w-3/4" />
                    <div className="h-3 bg-secondary/50 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : activity.length === 0 ? (
            <div className="border border-dashed rounded-lg p-16 text-center text-muted-foreground">
              No activity has been recorded yet.
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-semibold text-muted-foreground">{date}</span>
                    <div className="flex-1 h-px bg-border" />
                    <Badge variant="secondary" className="font-mono text-xs">{items.length}</Badge>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => {
                      const cfg = getConfig(item.type);
                      return (
                        <Card key={item.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="flex items-start gap-4 p-4">
                            <div className={`p-2 rounded-lg border shrink-0 mt-0.5 ${cfg.color}`}>
                              {cfg.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium leading-snug">{item.description}</p>
                                <span className="text-xs text-muted-foreground font-mono shrink-0">
                                  {formatRelativeTime(item.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 font-mono uppercase ${cfg.color}`}
                                >
                                  {cfg.label}
                                </Badge>
                                {item.studentName && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    {item.studentName}
                                  </span>
                                )}
                                {item.submissionId && (
                                  <span className="text-xs text-muted-foreground font-mono">
                                    Sub #{item.submissionId}
                                  </span>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
