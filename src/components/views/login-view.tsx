"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Activity,
  Lock,
  Mail,
  ShieldCheck,
  Stethoscope,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export function LoginView() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@kinemetrix.app");
  const [password, setPassword] = useState("demo1234");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Credenciales inválidas. Verifique email y contraseña.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Panel izquierdo - branding */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary/95 via-primary to-cyan-700 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 400 400" fill="none">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" stroke="white" strokeWidth="0.5" fill="none" />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#grid)" />
            <circle cx="200" cy="200" r="160" stroke="white" strokeWidth="1" fill="none" opacity="0.4" />
            <circle cx="200" cy="200" r="100" stroke="white" strokeWidth="1" fill="none" opacity="0.6" />
            <path d="M50 300 Q 100 250, 150 280 T 250 270 T 350 240" stroke="white" strokeWidth="2" fill="none" opacity="0.8" />
          </svg>
        </div>
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl overflow-hidden ring-2 ring-white/30 shadow-lg">
              { }
              <img src="/logo.svg" alt="Kinemetrix" className="h-full w-full object-contain" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Kinemetrix</h1>
              <p className="text-xs uppercase tracking-[0.18em] opacity-80 font-medium">
                Antropometría · IMC
              </p>
            </div>
          </div>
        </div>
        <div className="relative space-y-6">
          <h2 className="text-3xl font-bold leading-tight max-w-md">
            Plataforma profesional de evaluación antropométrica y análisis del IMC
          </h2>
          <p className="text-sm opacity-85 max-w-md leading-relaxed">
            Registro longitudinal de mediciones, cálculo automático del Índice de Masa Corporal
            (Quetelet) según criterios OMS, interpretación clínica diferenciada para adultos y
            población pediátrica, e informes técnicos exportables en PDF.
          </p>
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/15">
              <ShieldCheck className="h-5 w-5 mb-2 opacity-90" />
              <p className="text-xs font-semibold">Autenticación segura</p>
              <p className="text-[11px] opacity-75">Protección de datos clínicos</p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/15">
              <Activity className="h-5 w-5 mb-2 opacity-90" />
              <p className="text-xs font-semibold">Cálculo OMS</p>
              <p className="text-[11px] opacity-75">Criterios ISAK · Quetelet</p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/15">
              <Stethoscope className="h-5 w-5 mb-2 opacity-90" />
              <p className="text-xs font-semibold">Historial longitudinal</p>
              <p className="text-[11px] opacity-75">Comparación entre fechas</p>
            </div>
            <div className="rounded-lg bg-white/10 backdrop-blur-sm p-3 border border-white/15">
              <Lock className="h-5 w-5 mb-2 opacity-90" />
              <p className="text-xs font-semibold">Informe PDF</p>
              <p className="text-[11px] opacity-75">Documentación profesional</p>
            </div>
          </div>
        </div>
        <div className="relative text-[11px] opacity-70">
          © {new Date().getFullYear()} Kinemetrix · Ciencias del Movimiento Humano
        </div>
      </div>

      {/* Panel derecho - formulario */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="lg:hidden mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl overflow-hidden ring-1 ring-border">
                { }
                <img src="/logo.svg" alt="Kinemetrix" className="h-full w-full object-contain" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">Kinemetrix</h1>
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">
                  Antropometría · IMC
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight">Acceso profesional</h2>
            <p className="text-sm text-muted-foreground">
              Ingrese sus credenciales para acceder al sistema de evaluación antropométrica.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email institucional
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="pl-9 h-11"
                  placeholder="profesional@clinica.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="pl-9 pr-9 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando credenciales...
                </>
              ) : (
                "Ingresar al sistema"
              )}
            </Button>
          </form>

          <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold text-primary mb-1">Cuenta de demostración</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Email: <code className="bg-background px-1.5 py-0.5 rounded text-[10px]">demo@kinemetrix.app</code>
              <br />
              Contraseña: <code className="bg-background px-1.5 py-0.5 rounded text-[10px]">demo1234</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
