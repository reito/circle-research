const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  // Create universities
  const universities = await Promise.all([
    prisma.university.create({
      data: {
        name: "東京大学",
        domain: "u-tokyo.ac.jp",
      },
    }),
    prisma.university.create({
      data: {
        name: "早稲田大学",
        domain: "waseda.jp",
      },
    }),
    prisma.university.create({
      data: {
        name: "慶應義塾大学",
        domain: "keio.ac.jp",
      },
    }),
  ])

  console.log("Created universities:", universities.map(u => u.name).join(", "))

  // Create test users
  const hashedPassword = await bcrypt.hash("testpassword", 12)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "test@example.com",
        name: "Test User",
        passwordDigest: hashedPassword,
        universityId: universities[0].id,
        authProvider: "password",
      },
    }),
    prisma.user.create({
      data: {
        email: "demo@example.com",
        name: "Demo User",
        passwordDigest: hashedPassword,
        universityId: universities[1].id,
        authProvider: "password",
      },
    }),
  ])

  console.log("Created test users:", users.map(u => u.email).join(", "))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })