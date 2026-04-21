/**
 * @swagger
 * tags:
 *   - name: Admin - Tipe Komponen Payroll
 *     description: Manajemen master tipe komponen payroll dari panel admin.
 * /api/admin/tipe-komponen-payroll:
 *   get:
 *     summary: Daftar tipe komponen payroll
 *     description: Mengambil daftar tipe komponen payroll dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Tipe Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Nomor halaman.
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Jumlah data per halaman.
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama tipe komponen.
 *       - in: query
 *         name: nama_tipe_komponen
 *         schema:
 *           type: string
 *         description: Filter berdasarkan nama tipe komponen.
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *         description: Isi 1 untuk menyertakan data yang sudah di-soft delete.
 *       - in: query
 *         name: deletedOnly
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *         description: Isi 1 untuk hanya mengambil data yang sudah di-soft delete.
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, nama_tipe_komponen]
 *           default: created_at
 *         description: Kolom pengurutan.
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Arah pengurutan.
 *     responses:
 *       '200':
 *         description: Daftar tipe komponen payroll berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TipeKomponenPayroll'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     pageSize:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat tipe komponen payroll
 *     description: Membuat tipe komponen payroll baru. Jika ditemukan data soft delete dengan nama yang sama, data akan dipulihkan dan diperbarui.
 *     tags: [Admin - Tipe Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - nama_tipe_komponen
 *             properties:
 *               nama_tipe_komponen:
 *                 type: string
 *                 maxLength: 100
 *     responses:
 *       '200':
 *         description: Data soft delete berhasil dipulihkan dan diperbarui.
 *       '201':
 *         description: Tipe komponen payroll berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TipeKomponenPayroll'
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '409':
 *         description: Nama tipe komponen bentrok dengan data aktif.
 *       '500':
 *         description: Terjadi kesalahan server.
 * components:
 *   schemas:
 *     TipeKomponenPayroll:
 *       type: object
 *       properties:
 *         id_tipe_komponen_payroll:
 *           type: string
 *         nama_tipe_komponen:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         _count:
 *           type: object
 *           properties:
 *             definisi_komponen:
 *               type: integer
 */

const adminTipeKomponenPayrollDocs = {};

export default adminTipeKomponenPayrollDocs;
