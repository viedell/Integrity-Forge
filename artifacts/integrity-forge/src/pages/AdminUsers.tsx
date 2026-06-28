import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Search, Trash2, ShieldCheck, GraduationCap, BookOpen } from "lucide-react";

type UserRole = "student" | "instructor" | "admin";

interface AppUser {
  id: number;
  clerkId: string;
  role: UserRole | null;
  name: string;
  email: string;
  createdAt: string;
}

function roleBadge(role: UserRole | null) {
  switch (role) {
    case "admin":
      return (
        <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100/80 gap-1">
          <ShieldCheck className="w-3 h-3" /> Admin
        </Badge>
      );
    case "instructor":
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100/80 gap-1">
          <BookOpen className="w-3 h-3" /> Instructor
        </Badge>
      );
    case "student":
      return (
        <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100/80 gap-1">
          <GraduationCap className="w-3 h-3" /> Student
        </Badge>
      );
    default:
      return <Badge variant="secondary">No Role</Badge>;
  }
}

export default function AdminUsers() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [pendingRoles, setPendingRoles] = useState<Record<number, UserRole>>({});

  const { data: users = [], isLoading } = useQuery<AppUser[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
  });

  const updateRole = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: UserRole }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      return res.json();
    },
    onSuccess: (updated: AppUser) => {
      qc.setQueryData<AppUser[]>(["admin-users"], (old = []) =>
        old.map((u) => (u.id === updated.id ? updated : u)),
      );
      setPendingRoles((p) => {
        const copy = { ...p };
        delete copy[updated.id];
        return copy;
      });
      toast({ title: "Role updated", description: `${updated.name} is now ${updated.role}.` });
    },
    onError: () => toast({ title: "Error", description: "Could not update role.", variant: "destructive" }),
  });

  const deleteUser = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete user");
    },
    onSuccess: (_: void, id: number) => {
      qc.setQueryData<AppUser[]>(["admin-users"], (old = []) => old.filter((u) => u.id !== id));
      toast({ title: "User removed", description: "The account has been deleted." });
    },
    onError: () => toast({ title: "Error", description: "Could not delete user.", variant: "destructive" }),
  });

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const counts = {
    student: users.filter((u) => u.role === "student").length,
    instructor: users.filter((u) => u.role === "instructor").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <AppLayout title="User Management" subtitle="View, promote, and remove platform accounts" role="admin">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Students</CardTitle>
            <GraduationCap className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{counts.student}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Instructors</CardTitle>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{counts.instructor}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{counts.admin}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" /> All Accounts
              </CardTitle>
              <CardDescription>{users.length} registered user{users.length !== 1 ? "s" : ""}</CardDescription>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-secondary/30 rounded animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
              {search ? "No users match your search." : "No accounts registered yet."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-secondary/30 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Current Role</th>
                    <th className="px-4 py-3 font-medium">Change Role</th>
                    <th className="px-4 py-3 font-medium text-right">Joined</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => {
                    const pending = pendingRoles[user.id];
                    const isDirty = pending !== undefined && pending !== user.role;
                    return (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/10 transition-colors">
                        <td className="px-4 py-3 font-medium">{user.name}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{user.email}</td>
                        <td className="px-4 py-3">{roleBadge(user.role)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Select
                              value={pending ?? user.role ?? ""}
                              onValueChange={(val) =>
                                setPendingRoles((p) => ({ ...p, [user.id]: val as UserRole }))
                              }
                            >
                              <SelectTrigger className="w-36 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Student</SelectItem>
                                <SelectItem value="instructor">Instructor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                            {isDirty && (
                              <Button
                                size="sm"
                                className="h-8 text-xs"
                                disabled={updateRole.isPending}
                                onClick={() =>
                                  updateRole.mutate({ id: user.id, role: pending })
                                }
                              >
                                Save
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground font-mono text-xs">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete account?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently remove <strong>{user.name}</strong> ({user.email}) from the platform. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => deleteUser.mutate(user.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
