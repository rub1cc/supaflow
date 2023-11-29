import { createPagesServerClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";

export const getPageServerUser = async (context: GetServerSidePropsContext) => {
  const supabaseClient = createPagesServerClient(context);
  const res = await supabaseClient.auth.getUser();

  return res.data.user;
};

export const getPageServerSubscriptions = async (
  context: GetServerSidePropsContext
) => {
  const supabaseClient = createPagesServerClient(context);
  const res = await supabaseClient.from("subscriptions").select("*");

  return res.data;
};

export const returnRedirectToLogin = {
  redirect: {
    destination: "/login",
    permanent: false,
  },
};

export const returnRedirectToApp = {
  redirect: {
    destination: "/app",
    permanent: false,
  },
};

export const returnRedirectToWaitingAccess = {
  redirect: {
    destination: "/waiting-access",
    permanent: false,
  },
};
