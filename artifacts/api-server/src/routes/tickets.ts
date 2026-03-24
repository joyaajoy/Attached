import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { ticketsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

const router: IRouter = Router();

router.get("/", async (req, res) => {
  try {
    const tickets = await db.select().from(ticketsTable).orderBy(ticketsTable.saved_at);
    res.json({
      tickets: tickets.map(t => ({
        id: t.id,
        segment: JSON.parse(t.segment_json),
        date: t.travel_date,
        saved_at: t.saved_at.toISOString(),
        status: t.status,
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Error fetching tickets");
    res.status(500).json({ tickets: [] });
  }
});

router.post("/", async (req, res) => {
  try {
    const { segment, date } = req.body;
    if (!segment || !date) {
      res.status(400).json({ error: "segment and date are required" });
      return;
    }

    const id = randomUUID();
    const now = new Date();

    await db.insert(ticketsTable).values({
      id,
      segment_json: JSON.stringify(segment),
      travel_date: date,
      saved_at: now,
      status: "active",
    });

    res.status(201).json({
      id,
      segment,
      date,
      saved_at: now.toISOString(),
      status: "active",
    });
  } catch (err) {
    req.log.error({ err }, "Error saving ticket");
    res.status(500).json({ error: "Failed to save ticket" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await db.delete(ticketsTable).where(eq(ticketsTable.id, req.params.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Error deleting ticket");
    res.status(500).json({ error: "Failed to delete ticket" });
  }
});

export default router;
