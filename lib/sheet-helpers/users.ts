import { sheets, SPREADSHEET_ID } from "../google";
import { User, UserRole } from "../types";

const USERS_SHEET_RANGE = "users!A2:D";
const USERS_HEADER = ["username", "password", "role", "createdAt"];

export { USERS_HEADER };

export async function getUserByCredentials(
  usernameStr: string,
  passwordStr: string
): Promise<{ username: string; role: string } | null> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "users!A2:D",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) return null;

    const row = rows.find((r) => (r[0] || "").trim() === usernameStr && r[1] === passwordStr);
    if (row) {
      return { username: row[0].trim(), role: row[2] || "user" };
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unable to parse range")) {
      console.error("The 'users' tab does not exist in the Google Sheet!");
    } else {
      console.error("Error finding user:", error);
    }
    return null;
  }
  return null;
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: USERS_SHEET_RANGE,
    });
    const rows = res.data.values || [];
    return rows.map((r) => ({
      username: r[0] || "",
      password: r[1] || "",
      role: (r[2] as UserRole) || "user",
      createdAt: r[3] || "",
    }));
  } catch (err) {
    console.error("getAllUsers error:", err);
    return [];
  }
}

export async function createUser(user: Omit<User, "createdAt">): Promise<void> {
  const createdAt = new Date().toISOString();
  const newUser: User = { ...user, createdAt };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: USERS_SHEET_RANGE,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[newUser.username, newUser.password, newUser.role, newUser.createdAt]],
    },
  });
}

export async function updateUser(
  username: string,
  updates: Partial<Pick<User, "password" | "role">>
): Promise<void> {
  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "users!A:A",
  });
  const usernames = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = usernames.indexOf(username);
  if (rowIndex === -1) throw new Error(`User ${username} not found`);

  const sheetRow = rowIndex + 1;

  const curRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!A${sheetRow}:D${sheetRow}`,
  });
  const cur = curRes.data.values?.[0] || [];

  const merged = [
    cur[0] || username,
    updates.password !== undefined ? updates.password : cur[1] || "",
    updates.role !== undefined ? updates.role : cur[2] || "user",
    cur[3] || new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!A${sheetRow}:D${sheetRow}`,
    valueInputOption: "RAW",
    requestBody: { values: [merged] },
  });
}

export async function deleteUser(username: string): Promise<void> {
  const idRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "users!A:A",
  });
  const usernames = idRes.data.values?.map((r) => r[0]) || [];
  const rowIndex = usernames.indexOf(username);
  if (rowIndex === -1) throw new Error(`User ${username} not found`);

  const sheetRow = rowIndex + 1;

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `users!A${sheetRow}:D${sheetRow}`,
  });
}
