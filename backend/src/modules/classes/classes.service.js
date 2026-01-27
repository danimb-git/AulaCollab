const { v4: uuidv4 } = require("uuid");
const prisma = require("../../db/prisma");

async function createClass({ nom, descripcio, professorId }) {
  const classId = uuidv4();

  const newClass = await prisma.classes.create({
    data: {
      id: classId,
      nom,
      descripcio,
      professor_id: professorId,
      class_members: {
        create: {
          user_id: professorId, // el professor també és membre
        },
      },
    },
  });

  return newClass;
}

module.exports = {
  createClass,
};
