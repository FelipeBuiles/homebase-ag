import prisma from "@/lib/prisma";

export async function getAppConfig() {
  return prisma.appConfig.findFirst();
}
