import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await hash("pacelli123", 10);

  const teachers = [
    { name: "Admin Teacher", email: "admin@pacelli.edu" },
    { name: "Mrs. Smith", email: "smith@pacelli.edu" },
    { name: "Mr. Johnson", email: "johnson@pacelli.edu" },
  ];

  for (const teacher of teachers) {
    await prisma.teacher.upsert({
      where: { email: teacher.email },
      update: {},
      create: {
        name: teacher.name,
        email: teacher.email,
        passwordHash,
      },
    });
  }

  const sampleStudents = [
    { firstName: "Emma", lastName: "Anderson", studentNumber: "1001", grade: "9", balanceCents: 1500 },
    { firstName: "Liam", lastName: "Brown", studentNumber: "1002", grade: "10", balanceCents: 800 },
    { firstName: "Olivia", lastName: "Carter", studentNumber: "1003", grade: "11", balanceCents: 2200 },
    { firstName: "Noah", lastName: "Davis", studentNumber: "1004", grade: "12", balanceCents: 500 },
    { firstName: "Ava", lastName: "Edwards", studentNumber: "1005", grade: "9", balanceCents: 1250 },
  ];

  for (const student of sampleStudents) {
    await prisma.student.upsert({
      where: { studentNumber: student.studentNumber },
      update: {},
      create: student,
    });
  }

  console.log("Seed complete.");
  console.log("Teachers can sign in with password: pacelli123");
  console.log("Example: admin@pacelli.edu / pacelli123");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
