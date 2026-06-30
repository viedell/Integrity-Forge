import { useEffect, useRef, useState } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk, useUser } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/Home";
import StudentPortal from "@/pages/StudentPortal";
import ResearchGapFinder from "@/pages/ResearchGapFinder";
import InstructorDashboard from "@/pages/InstructorDashboard";
import InstructorTemplates from "@/pages/InstructorTemplates";
import AdminConsole from "@/pages/AdminConsole";
import AdminActivity from "@/pages/AdminActivity";
import AdminUsers from "@/pages/AdminUsers";
import NotFound from "@/pages/not-found";
import Onboarding from "@/pages/Onboarding";
import SignInPage from "@/pages/SignInPage";
import SignUpPage from "@/pages/SignUpPage";

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#2563EB",
    colorForeground: "#0f172a",
    colorMutedForeground: "#64748b",
    colorDanger: "#dc2626",
    colorBackground: "#f8fafc",
    colorInput: "#ffffff",
    colorInputForeground: "#0f172a",
    colorNeutral: "#e2e8f0",
    fontFamily: "'Outfit', sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-lg border border-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 font-bold",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    formFieldLabel: "text-slate-700 font-medium",
    footerActionLink: "text-blue-600 hover:text-blue-700 font-medium",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    identityPreviewEditButton: "text-blue-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-slate-700",
    logoBox: "flex justify-center",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton: "border border-slate-200 hover:bg-slate-50",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold",
    formFieldInput: "border-slate-200 bg-white text-slate-900",
    footerAction: "bg-slate-50",
    dividerLine: "bg-slate-200",
    alert: "bg-red-50 border border-red-200",
    otpCodeFieldInput: "border-slate-200",
    formFieldRow: "",
    main: "",
  },
};

type UserRole = "student" | "instructor" | "admin" | null;

function RoleGate({ role, dest, children }: { role: UserRole; dest: string; children: React.ReactNode }) {
  if (role === null) return <Redirect to="/onboarding" />;
  if (role !== dest) return <Redirect to={`/${role}`} />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoaded } = useUser();
  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined);
  const [roleLoaded, setRoleLoaded] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      setRoleLoaded(true);
      return;
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        setUserRole(data?.role ?? null);
        setRoleLoaded(true);
      })
      .catch(() => {
        setUserRole(null);
        setRoleLoaded(true);
      });
  }, [user, isLoaded]);

  if (!isLoaded || !roleLoaded) return null;

  return (
    <Switch>
      <Route path="/sign-in/*?" component={SignInPage} />
      <Route path="/sign-up/*?" component={SignUpPage} />

      <Route path="/">
        <Show when="signed-in">
          {userRole === null ? <Redirect to="/onboarding" /> : <Redirect to={`/${userRole}`} />}
        </Show>
        <Show when="signed-out">
          <Home />
        </Show>
      </Route>

      <Route path="/onboarding">
        <Show when="signed-in">
          <Onboarding onRoleSet={(r) => setUserRole(r)} />
        </Show>
        <Show when="signed-out">
          <Redirect to="/" />
        </Show>
      </Route>

      <Route path="/student">
        <Show when="signed-in">
          <RoleGate role={userRole ?? null} dest="student">
            <StudentPortal />
          </RoleGate>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>

      <Route path="/student/gap-finder">
        <Show when="signed-in">
          <RoleGate role={userRole ?? null} dest="student">
            <ResearchGapFinder />
          </RoleGate>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>

      <Route path="/instructor">
        <Show when="signed-in">
          <RoleGate role={userRole ?? null} dest="instructor">
            <InstructorDashboard />
          </RoleGate>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>

      <Route path="/instructor/templates">
        <Show when="signed-in">
          <RoleGate role={userRole ?? null} dest="instructor">
            <InstructorTemplates />
          </RoleGate>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>

      <Route path="/admin">
        <Show when="signed-in">
          <RoleGate role={userRole ?? null} dest="admin">
            <AdminConsole />
          </RoleGate>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>

      <Route path="/admin/activity">
        <Show when="signed-in">
          <RoleGate role={userRole ?? null} dest="admin">
            <AdminActivity />
          </RoleGate>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>

      <Route path="/admin/users">
        <Show when="signed-in">
          <RoleGate role={userRole ?? null} dest="admin">
            <AdminUsers />
          </RoleGate>
        </Show>
        <Show when="signed-out">
          <Redirect to="/sign-in" />
        </Show>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your IntegrityForge account",
          },
        },
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Join IntegrityForge today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <AppRoutes />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
