<<<<<<< HEAD
<<<<<<< HEAD
// import { PrismaClient } from '@prisma/client';

// const globalForPrisma = global;

// const db =
//   globalForPrisma.prisma ||
//   new PrismaClient({
//     log:
//       process.env.NODE_ENV === "development"
//         ? ["query", "info", "warn", "error"]
//         : ["error"],
//   });

// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

// module.exports = db;
=======
=======
>>>>>>> branch-dewa-adit
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

const db =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;

export default db;
<<<<<<< HEAD
>>>>>>> ae27c2cdb1fc0f00b1f904650ce3e062226ef4d3
=======
>>>>>>> branch-dewa-adit
