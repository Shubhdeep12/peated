import type { RouteHandlerMethod } from "fastify";
import { prisma } from "../lib/db";
import { createAccessToken } from "../lib/auth";
import { Algorithm, decode } from "jsonwebtoken";
import config from "../config";
import { verify } from "jsonwebtoken";
import { JwksClient } from "jwks-rsa";

// export const googleCallback: RouteHandlerMethod = async function (req, res) {
//   const { token } =
//     await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);

//   let user = await prisma.identity.findUnique({
//     where: { provider: "google", externalId: token },
//   });

//   return res.send({
//     data: { user, accessToken: await createAccessToken(data) },
//   });
// };
type GoogleCredential = {
  iss: string;
  nbf: number;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  azp: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
  jti: string;
};

const jwksClient = new JwksClient({
  jwksUri: "https://www.googleapis.com/oauth2/v2/certs",
  timeout: 3000,
});

async function retrieveSigningKey(kid: string) {}

// TODO: verify signing key - not entirely sure if the jwt library exposes this for me?
// https://www.googleapis.com/oauth2/v2/certs
export const authGoogle: RouteHandlerMethod = async function (req, res) {
  const { token } = req.body;

  const response = decode(token, { complete: true });
  if (!response) {
    res.status(400).send({ error: "Invalid token (invalid)" });
    return;
  }

  const { header } = response;
  if (!header.kid) {
    res.status(400).send({ error: "Invalid token (kid)" });
    return;
  }

  const signingKey = await jwksClient.getSigningKey(header.kid);

  const payload = verify(token, signingKey.publicKey, {
    algorithms: [header.alg as Algorithm],
  }) as GoogleCredential | undefined;
  if (!payload) {
    res.status(400).send({ error: "Invalid token (verify)" });
    return;
  }

  if (
    payload.iss !== "https://accounts.google.com" ||
    payload.aud !== config.GOOGLE_CLIENT_ID
  ) {
    res.status(400).send({ error: "Invalid token (iss)" });
    return;
  }

  if (payload.exp < new Date().getTime() / 1000) {
    res.status(400).send({ error: "Invalid token (expired)" });
    return;
  }

  let user = await prisma.identity.findFirst({
    where: { provider: "google", externalId: payload.sub },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        displayName: payload.given_name,
        email: payload.email,
        identities: {
          create: [
            {
              provider: "google",
              externalId: payload.sub,
            },
          ],
        },
      },
    });
  }

  return res.send({
    data: { user, accessToken: await createAccessToken(user) },
  });
};
