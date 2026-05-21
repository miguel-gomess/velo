import { useEffect, useState } from "react";
import { apiGetMe, type Usuario } from "../lib/api";

type ProfileState = {
  email: string;
  user: Usuario | null;
  error: string | null;
  ready: boolean;
};

export function useProfile(email: string | null): ProfileState {
  const [state, setState] = useState<ProfileState>({
    email: "",
    user: null,
    error: null,
    ready: false,
  });

  useEffect(() => {
    if (!email) {
      setState({ email: "", user: null, error: null, ready: false });
      return;
    }

    let cancelled = false;
    setState((s) => ({ ...s, ready: false, email }));

    apiGetMe()
      .then((user) => {
        if (!cancelled) {
          setState({ email, user, error: null, ready: true });
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setState({
            email,
            user: null,
            error: e instanceof Error ? e.message : "Error al cargar perfil",
            ready: true,
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [email]);

  return state;
}
