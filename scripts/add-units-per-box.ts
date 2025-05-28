import * as dotenv from 'dotenv';
import * as admin from 'firebase-admin';
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: 'kvisakol-orders', // Hardcoded
      clientEmail: 'firebase-adminsdk-fbsvc@kvisakol-orders.iam.gserviceaccount.com', // Hardcoded
      privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCq26MV3liTg3RC
M5LLY2jIYPFXhpGP5MbBn21WGgylcLRknC5jTNA/Z/t1CRZZLJw44gupI7mfW1Nj
pLJ9Aq9N6XXykpV9uCC2HldxcCgD8kbrojbkDxlTFMpKR4z1cpmG4p2IK9Siwlje
/EzD3yuJfDkn9vnA+wauYVv7GdB16NCnWqJh3JOgMqyNPQPR2F1Wy++mptUglTdy
RhllxjrZahecAF/kxHMWLiAi8c64vbyFAJ3bJG5tmVj9K51AB66h8JtfwSIblhCO
D+Y2gXup0C+S0PSWE37CCnKab/mPA5zbTD0nZ2fhJhrdPaGajKJ00Yuocl9+zqBDZ
RbeNWLjFAgMBAAECggEAA6Xjc2MU8oA2c2UeN67sZfUmNpZXY0uOwkPccVadVRSr
9Vlmnd4nRvonfHEuzNRWS0gN/Rxg4BVyq6PVTX22wVmJc5aVWRmvekGwckV1fB7x
xcP2qYYIuKhmGieYKn2779sJQMnbS05PzkqvUGp+qgCmz1iOb9mRu2V8p7uK3gAGG
TtyrYPBOGEcTDUtdnHJMqkUebXgYJEut0Cp6smNkS+LUbriJSbyApYK+rUuwusb5
L8ks0RE43RFsSgaeHvVCADTLW7MRaFunP2MTbTneTJkMHPCtcb4ZXKjXofw9+3oS
/x48OKrXeqrXFSOGkgNyUUFpqWv0Wa5tLGRYmLQbfQKBgQDiFsu7AHguFsAN0PIB
38pNqua0y5u1K7YYaMIhWMm4NWvDIQGRC4jaVWJaFjkFaqj6DYLq8GyNOlOTFyxL
bGqXQxwJvgvOHqXngk8HLbbE6F1VZSWUWirRJRe4OJbrolV0ymWT5jKcpIkwumi4
cjmn/LyZ9zjpdE2Pa9odX5IZKwKBgQDBdkUNZrq+PVyUXtwNZrcc+ZWY46ADXv1Q
dlFKZxYaSCfGfRDXDr6zv7syAltsuZRjJC6vSrvq0UNhsKvXWoJwuOEkNyCEeGsm
KeGMhU0Pvbnqg/tit+2mpyE/oLoxprsIgtY2P7soQ/Nxk1bpRoS72gCTNu0NNYPa
UoKNNNWdzwKBgQDO2XxcAvnxcO8VtO01ucIlfQ7GquIyx2M6wd2bFNi5qGaHiFMe
mScEWso5EcvpoMQowuPcf0tRiuOb17+24eJDsiqc3zt9wZyYSyhysOhfDxkVYA0Z
UWxJEHAv9RZpw41lRJFHuJxR+fbW0SE6+ceicz1nRDYxzy8wIDjcTlMQKBgDz4
Nv7oN0YpNHoWAye+DUt1ZO0QH6ewUgj/oNLf9hlGUDK/y4TbQsKHVEmIcKOtQNSV
3Jil5t80IBYzhZSTE7TOrzWoofjdsncOj+SnRggF9QexnJIaAS2aUmIpF0T6lMsz
4KqsHyGreJd8pdFSxhYluDStBLw691jg1AAIfKIFAoGAe1AnKCG/Jtuf03t/0uAY
eRC/hd8/kaxPSyAe3rBJzgVR2ikfbvRI7uUHf/cXqYK2peZ9ymwGurtEQUrQzdlp
2NTNTuw/Xp9ykkgHxkeKhrYvxXbI2pTJUEZvi6kpfNRGh4FNMQOmx+kvn/ei5cZy
OE0Q+JUxH1CgP/Qn4/4O54=`, // Hardcoded
    }),
  });
}
dotenv.config({ path: '.env.local' });

const db = admin.firestore();

const updateUnitsPerBox = async () => {
  console.log("Starting script to add unitsPerBox field...");

  try {
    const querySnapshot = await db.collection('products').get();

    console.log(`Found ${querySnapshot.size} documents.`);
    const updatePromises: Promise<void>[] = [];
    let updatedCount = 0;

    querySnapshot.forEach((document) => {
      const productData = document.data();
      // Update the document using the Admin SDK's update method
      const updatePromise = document.ref.update({
        unitsPerBox: 8,
        consumerPrice: productData.price,
      })
      .then(() => {
        updatedCount++;
        console.log(`Updated document with ID: ${document.id}`);
      })
      .catch((error: any) => { // Add type annotation for error
        console.error(`Error updating document with ID: ${document.id}`, error);
      });
      updatePromises.push(updatePromise);
    });

    await Promise.all(updatePromises);

    if (updatedCount > 0) {
      console.log(`Finished updating. ${updatedCount} documents processed.`);
    } else {
        console.log("No products found in the 'products' collection or no documents needed update.");
    }

  } catch (error) {
    console.error("Error running script:", error);
  }
};

// Execute the script
updateUnitsPerBox();