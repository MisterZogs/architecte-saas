import {
  type GetPasswordResetEmailContentFn,
  type GetVerificationEmailContentFn,
} from "wasp/server/auth";

export const getVerificationEmailContent: GetVerificationEmailContentFn = ({
  verificationLink,
}) => ({
  subject: "ArchitecteIA — Confirmez votre adresse email",
  text: `Bienvenue sur ArchitecteIA ! Cliquez sur le lien ci-dessous pour confirmer votre adresse email : ${verificationLink}`,
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#1a1a1a">Bienvenue sur ArchitecteIA</h2>
      <p>Cliquez sur le bouton ci-dessous pour confirmer votre adresse email et accéder à vos outils.</p>
      <a href="${verificationLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
        Confirmer mon email
      </a>
      <p style="color:#6b7280;font-size:13px">Si vous n'avez pas créé de compte, ignorez cet email.</p>
    </div>
  `,
});

export const getPasswordResetEmailContent: GetPasswordResetEmailContentFn = ({
  passwordResetLink,
}) => ({
  subject: "ArchitecteIA — Réinitialisation de votre mot de passe",
  text: `Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe : ${passwordResetLink}`,
  html: `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
      <h2 style="color:#1a1a1a">Réinitialisation de mot de passe</h2>
      <p>Vous avez demandé à réinitialiser votre mot de passe ArchitecteIA.</p>
      <a href="${passwordResetLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin:16px 0">
        Réinitialiser mon mot de passe
      </a>
      <p style="color:#6b7280;font-size:13px">Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
    </div>
  `,
});
