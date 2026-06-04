import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Stripe from "stripe";

type IntegrationStatus = {
  description: string;
  env: string[];
  name: string;
  ready: boolean;
  role: string;
};

function hasEnv(keys: string[]) {
  return keys.every((key) => Boolean(process.env[key]));
}

export const integrations: IntegrationStatus[] = [
  {
    name: "Supabase",
    role: "Base de données",
    description: "Stockage relationnel des porteurs, dossiers, pièces, droits d'accès et événements métier.",
    env: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    ready: hasEnv(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"])
  },
  {
    name: "Better Auth",
    role: "Authentification",
    description: "Gestion des sessions, comptes, organisations et parcours sécurisés.",
    env: ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"],
    ready: hasEnv(["BETTER_AUTH_SECRET", "BETTER_AUTH_URL"])
  },
  {
    name: "Vercel",
    role: "Déploiement",
    description: "Hébergement Next.js, previews par branche et variables d'environnement de production.",
    env: ["VERCEL_PROJECT_ID", "VERCEL_ORG_ID"],
    ready: hasEnv(["VERCEL_PROJECT_ID", "VERCEL_ORG_ID"])
  },
  {
    name: "Stripe",
    role: "Paiement",
    description: "Abonnements, facturation, portail client et webhooks de paiement.",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"],
    ready: hasEnv(["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"])
  },
  {
    name: "Namecheap",
    role: "Domaine",
    description: "Nom de domaine, DNS et pointage vers Vercel.",
    env: ["NAMECHEAP_DOMAIN"],
    ready: hasEnv(["NAMECHEAP_DOMAIN"])
  },
  {
    name: "Resend",
    role: "Mails",
    description: "Emails transactionnels : verification, notifications dossier, rappels d'echeance.",
    env: ["RESEND_API_KEY", "RESEND_FROM_EMAIL"],
    ready: hasEnv(["RESEND_API_KEY", "RESEND_FROM_EMAIL"])
  },
  {
    name: "Plausible",
    role: "Analytics sobre",
    description: "Mesure d'audience respectueuse, activee par script public uniquement si le domaine est configure.",
    env: ["NEXT_PUBLIC_PLAUSIBLE_DOMAIN"],
    ready: hasEnv(["NEXT_PUBLIC_PLAUSIBLE_DOMAIN"])
  },
  {
    name: "PostHog",
    role: "A/B testing et product analytics",
    description: "Evenements produit, funnels, feature flags et experimentations.",
    env: ["NEXT_PUBLIC_POSTHOG_KEY", "NEXT_PUBLIC_POSTHOG_HOST"],
    ready: hasEnv(["NEXT_PUBLIC_POSTHOG_KEY"])
  },
  {
    name: "Sentry",
    role: "Error tracking",
    description: "Suivi des erreurs frontend/backend, traces et alertes techniques.",
    env: ["NEXT_PUBLIC_SENTRY_DSN", "SENTRY_DSN"],
    ready: hasEnv(["NEXT_PUBLIC_SENTRY_DSN"]) || hasEnv(["SENTRY_DSN"])
  },
  {
    name: "Upstash",
    role: "Redis",
    description: "Cache, rate limiting, files d'attente legeres et verrous anti-double traitement.",
    env: ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"],
    ready: hasEnv(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"])
  }
];

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? createClient(url, anonKey) : null;
}

export function createSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && serviceRoleKey ? createClient(url, serviceRoleKey, { auth: { persistSession: false } }) : null;
}

export function createStripeClient() {
  return process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
}

export function createResendClient() {
  return process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
}

export function createRedisClient() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}
