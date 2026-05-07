import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  hasDynamicAdminFlag,
  isAdminUser,
  isNativeAdminEmail,
  normalizeEmail,
} from "@/lib/admin";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getEnvOrThrow(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function createPublicSupabase() {
  return createClient(
    getEnvOrThrow(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

function createServiceSupabase() {
  return createClient(
    getEnvOrThrow(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
    getEnvOrThrow(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

async function getRequestUser(request: NextRequest) {
  const authorization = request.headers.get("authorization") ?? "";
  const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return {
      user: null,
      error: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }),
    };
  }

  const supabase = createPublicSupabase();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Sessão inválida." }, { status: 401 }),
    };
  }

  return { user: data.user, error: null };
}

async function listAllUsers() {
  const serviceSupabase = createServiceSupabase();
  const allUsers: any[] = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await serviceSupabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    const users = data.users ?? [];
    allUsers.push(...users);

    if (users.length < perPage) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

function toAdminDto(user: any) {
  return {
    id: user.id,
    email: normalizeEmail(user.email),
    nome:
      user.user_metadata?.nome_completo ||
      user.user_metadata?.full_name ||
      user.app_metadata?.admin_name ||
      "Administrador",
    created_at: user.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await getRequestUser(request);
    if (error) return error;

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const users = await listAllUsers();
    const admins = users
      .filter((item) => hasDynamicAdminFlag(item))
      .map(toAdminDto)
      .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

    return NextResponse.json({ admins });
  } catch (error) {
    console.error("Erro ao listar administradores:", error);
    return NextResponse.json({ error: "Erro ao listar administradores." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getRequestUser(request);
    if (error) return error;

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);
    const nome = String(body?.nome ?? "").trim() || "Administrador";

    if (!email) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    const serviceSupabase = createServiceSupabase();
    const users = await listAllUsers();
    const targetUser = users.find((item) => normalizeEmail(item.email) === email);

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado no Auth." }, { status: 404 });
    }

    if (isNativeAdminEmail(email) || hasDynamicAdminFlag(targetUser)) {
      return NextResponse.json({ success: true, alreadyAuthorized: true, admin: toAdminDto(targetUser) });
    }

    const nextAppMetadata = {
      ...(targetUser.app_metadata ?? {}),
      is_admin: true,
      admin_name: nome,
    };

    const { data: updatedUser, error: updateError } = await serviceSupabase.auth.admin.updateUserById(
      targetUser.id,
      {
        app_metadata: nextAppMetadata,
      }
    );

    if (updateError) {
      console.error("Erro ao promover administrador:", updateError);
      return NextResponse.json({ error: "Não foi possível promover o usuário." }, { status: 500 });
    }

    return NextResponse.json({ success: true, admin: toAdminDto(updatedUser.user) });
  } catch (error) {
    console.error("Erro ao promover administrador:", error);
    return NextResponse.json({ error: "Erro interno ao promover administrador." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { user, error } = await getRequestUser(request);
    if (error) return error;

    if (!isAdminUser(user)) {
      return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
    }

    const body = await request.json();
    const email = normalizeEmail(body?.email);

    if (!email) {
      return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
    }

    if (isNativeAdminEmail(email)) {
      return NextResponse.json({ error: "Não é permitido revogar um admin nativo." }, { status: 400 });
    }

    if (normalizeEmail(user.email) === email) {
      return NextResponse.json({ error: "Você não pode revogar o próprio acesso." }, { status: 400 });
    }

    const serviceSupabase = createServiceSupabase();
    const users = await listAllUsers();
    const targetUser = users.find((item) => normalizeEmail(item.email) === email);

    if (!targetUser) {
      return NextResponse.json({ error: "Usuário não encontrado no Auth." }, { status: 404 });
    }

    const currentMetadata = { ...(targetUser.app_metadata ?? {}) };
    delete currentMetadata.is_admin;
    delete currentMetadata.admin_name;

    const { error: updateError } = await serviceSupabase.auth.admin.updateUserById(targetUser.id, {
      app_metadata: currentMetadata,
    });

    if (updateError) {
      console.error("Erro ao revogar administrador:", updateError);
      return NextResponse.json({ error: "Não foi possível revogar o usuário." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao revogar administrador:", error);
    return NextResponse.json({ error: "Erro interno ao revogar administrador." }, { status: 500 });
  }
}
