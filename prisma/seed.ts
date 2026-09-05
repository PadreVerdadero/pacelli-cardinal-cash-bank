import { PrismaClient, Role } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/** Super Admin login — change after first sign-in if desired. */
const JESSE_PASSWORD = "CardinalCash#Jesse1";

async function main() {
  const jesseHash = await hash(JESSE_PASSWORD, 10);
  const staffHash = await hash("pacelli123", 10);
  const studentHash = await hash("student123", 10);

  await prisma.user.upsert({
    where: { username: "jesse" },
    update: {
      name: "Jesse",
      role: Role.SUPER_ADMIN,
      active: true,
      passwordHash: jesseHash,
    },
    create: {
      name: "Jesse",
      username: "jesse",
      email: "jesse@cardinalcashbank.com",
      role: Role.SUPER_ADMIN,
      passwordHash: jesseHash,
    },
  });

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "School Admin",
      username: "admin",
      email: "admin@pacelli.edu",
      role: Role.ADMIN,
      passwordHash: staffHash,
    },
  });

  await prisma.user.upsert({
    where: { username: "smith" },
    update: {},
    create: {
      name: "Mrs. Smith",
      username: "smith",
      email: "smith@pacelli.edu",
      role: Role.TEACHER,
      passwordHash: staffHash,
    },
  });

  await prisma.user.upsert({
    where: { username: "johnson" },
    update: {},
    create: {
      name: "Mr. Johnson",
      username: "johnson",
      email: "johnson@pacelli.edu",
      role: Role.TEACHER,
      passwordHash: staffHash,
    },
  });

  const sampleStudents = [
    { firstName: "Emma", lastName: "Anderson", studentNumber: "1001", grade: "9", balanceCents: 1500, username: "eanderson" },
    { firstName: "Liam", lastName: "Brown", studentNumber: "1002", grade: "10", balanceCents: 800, username: "lbrown" },
    { firstName: "Olivia", lastName: "Carter", studentNumber: "1003", grade: "11", balanceCents: 2200, username: "ocarter" },
    { firstName: "Noah", lastName: "Davis", studentNumber: "1004", grade: "12", balanceCents: 500, username: "ndavis" },
    { firstName: "Ava", lastName: "Edwards", studentNumber: "1005", grade: "9", balanceCents: 1250, username: "aedwards" },
  ];

  for (const sample of sampleStudents) {
    const student = await prisma.student.upsert({
      where: { studentNumber: sample.studentNumber },
      update: {
        firstName: sample.firstName,
        lastName: sample.lastName,
        grade: sample.grade,
      },
      create: {
        firstName: sample.firstName,
        lastName: sample.lastName,
        studentNumber: sample.studentNumber,
        grade: sample.grade,
        balanceCents: sample.balanceCents,
      },
    });

    await prisma.user.upsert({
      where: { username: sample.username },
      update: { studentId: student.id, role: Role.STUDENT, active: true },
      create: {
        name: `${sample.firstName} ${sample.lastName}`,
        username: sample.username,
        role: Role.STUDENT,
        passwordHash: studentHash,
        studentId: student.id,
      },
    });
  }

  const activityCount = await prisma.activity.count();
  if (activityCount === 0) {
    await prisma.activity.createMany({
      data: [
        { name: "Helping a classmate", valueCents: 100, createdById: admin.id },
        { name: "Perfect attendance week", valueCents: 500, createdById: admin.id },
        { name: "Classroom leadership", valueCents: 250, createdById: admin.id },
      ],
    });
  }

  const storeCount = await prisma.storeItem.count();
  if (storeCount === 0) {
    await prisma.storeItem.createMany({
      data: [
        { name: "Pencil pack", priceCents: 150, createdById: admin.id },
        { name: "School spirit sticker", priceCents: 75, createdById: admin.id },
        { name: "Free dress pass", priceCents: 1000, createdById: admin.id },
      ],
    });
  }

  console.log("Seed complete.");
  console.log("Super Admin: jesse /", JESSE_PASSWORD);
  console.log("Sample Admin: admin / pacelli123");
  console.log("Sample Teacher: smith / pacelli123");
  console.log("Sample Student: eanderson / student123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
