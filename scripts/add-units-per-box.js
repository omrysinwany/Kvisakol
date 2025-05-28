"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv = require("dotenv");
var admin = require("firebase-admin");
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: 'kvisakol-orders', // Hardcoded
            clientEmail: 'firebase-adminsdk-fbsvc@kvisakol-orders.iam.gserviceaccount.com', // Hardcoded
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCq26MV3liTg3RC\nM5LLY2jIYPFXhpGP5MbBn21WGgylcLRknC5jTNA/Z/t1CRZZLJw44gupI7mfW1Nj\npLJ9Aq9N6XXykpV9uCC2HldxcCgD8kbrojbkDxlTFMpKR4z1cpmG4p2IK9Siwlje\n/EzD3yuJfDkn9vnA+wauYVv7GdB16NCnWqJh3JOgMqyNPQPR2F1Wy++mptUglTdy\nRhllxjrZahecAF/kxHMWLiAi8c64vbyFAJ3bJG5tmVj9K51AB66h8JtfwSIblhCO\nD+Y2gXup0C+S0PSWE37CCnKab/mPA5zbTD0nZ2fhJhrdPaGajKJ00Yuocl9+zqBDZ\nRbeNWLjFAgMBAAECggEAA6Xjc2MU8oA2c2UeN67sZfUmNpZXY0uOwkPccVadVRSr\n9Vlmnd4nRvonfHEuzNRWS0gN/Rxg4BVyq6PVTX22wVmJc5aVWRmvekGwckV1fB7x\nxcP2qYYIuKhmGieYKn2779sJQMnbS05PzkqvUGp+qgCmz1iOb9mRu2V8p7uK3gAGG\nTtyrYPBOGEcTDUtdnHJMqkUebXgYJEut0Cp6smNkS+LUbriJSbyApYK+rUuwusb5\nL8ks0RE43RFsSgaeHvVCADTLW7MRaFunP2MTbTneTJkMHPCtcb4ZXKjXofw9+3oS\n/x48OKrXeqrXFSOGkgNyUUFpqWv0Wa5tLGRYmLQbfQKBgQDiFsu7AHguFsAN0PIB\n38pNqua0y5u1K7YYaMIhWMm4NWvDIQGRC4jaVWJaFjkFaqj6DYLq8GyNOlOTFyxL\nbGqXQxwJvgvOHqXngk8HLbbE6F1VZSWUWirRJRe4OJbrolV0ymWT5jKcpIkwumi4\ncjmn/LyZ9zjpdE2Pa9odX5IZKwKBgQDBdkUNZrq+PVyUXtwNZrcc+ZWY46ADXv1Q\ndlFKZxYaSCfGfRDXDr6zv7syAltsuZRjJC6vSrvq0UNhsKvXWoJwuOEkNyCEeGsm\nKeGMhU0Pvbnqg/tit+2mpyE/oLoxprsIgtY2P7soQ/Nxk1bpRoS72gCTNu0NNYPa\nUoKNNNWdzwKBgQDO2XxcAvnxcO8VtO01ucIlfQ7GquIyx2M6wd2bFNi5qGaHiFMe\nmScEWso5EcvpoMQowuPcf0tRiuOb17+24eJDsiqc3zt9wZyYSyhysOhfDxkVYA0Z\nUWxJEHAv9RZpw41lRJFHuJxR+fbW0SE6+ceicz1nRDYxzy8wIDjcTlMQKBgDz4\nNv7oN0YpNHoWAye+DUt1ZO0QH6ewUgj/oNLf9hlGUDK/y4TbQsKHVEmIcKOtQNSV\n3Jil5t80IBYzhZSTE7TOrzWoofjdsncOj+SnRggF9QexnJIaAS2aUmIpF0T6lMsz\n4KqsHyGreJd8pdFSxhYluDStBLw691jg1AAIfKIFAoGAe1AnKCG/Jtuf03t/0uAY\neRC/hd8/kaxPSyAe3rBJzgVR2ikfbvRI7uUHf/cXqYK2peZ9ymwGurtEQUrQzdlp\n2NTNTuw/Xp9ykkgHxkeKhrYvxXbI2pTJUEZvi6kpfNRGh4FNMQOmx+kvn/ei5cZy\nOE0Q+JUxH1CgP/Qn4/4O54=", // Hardcoded
        }),
    });
}
dotenv.config({ path: '.env.local' });
var db = admin.firestore();
var updateUnitsPerBox = function () { return __awaiter(void 0, void 0, void 0, function () {
    var querySnapshot, updatePromises_1, updatedCount_1, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.log("Starting script to add unitsPerBox field...");
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                return [4 /*yield*/, db.collection('products').get()];
            case 2:
                querySnapshot = _a.sent();
                console.log("Found ".concat(querySnapshot.size, " documents."));
                updatePromises_1 = [];
                updatedCount_1 = 0;
                querySnapshot.forEach(function (document) {
                    var productData = document.data();
                    // Update the document using the Admin SDK's update method
                    var updatePromise = document.ref.update({
                        unitsPerBox: 8,
                        consumerPrice: productData.price,
                    })
                        .then(function () {
                        updatedCount_1++;
                        console.log("Updated document with ID: ".concat(document.id));
                    })
                        .catch(function (error) {
                        console.error("Error updating document with ID: ".concat(document.id), error);
                    });
                    updatePromises_1.push(updatePromise);
                });
                return [4 /*yield*/, Promise.all(updatePromises_1)];
            case 3:
                _a.sent();
                if (updatedCount_1 > 0) {
                    console.log("Finished updating. ".concat(updatedCount_1, " documents processed."));
                }
                else {
                    console.log("No products found in the 'products' collection or no documents needed update.");
                }
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                console.error("Error running script:", error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
// Execute the script
updateUnitsPerBox();
