import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  
  const settings = await prisma.offerSettings.findUnique({
    where: { shop: session.shop },
  });

  return settings || {};
};