/**
 * @swagger
 * tags:
 *   - name: Admin - Definisi Komponen Payroll
 *     description: Manajemen definisi komponen payroll dari panel admin.
 * /api/admin/definisi-komponen-payroll:
 *   get:
 *     summary: Daftar definisi komponen payroll
 *     description: Mengambil daftar definisi komponen payroll dengan filter, pencarian, sorting, dan pagination.
 *     tags: [Admin - Definisi Komponen Payroll]
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
 *         description: Cari berdasarkan nama komponen, nama tipe komponen, atau catatan.
 *       - in: query
 *         name: id_tipe_komponen_payroll
 *         schema:
 *           type: string
 *         description: Filter berdasarkan ID tipe komponen payroll.
 *       - in: query
 *         name: nama_tipe_komponen
 *         schema:
 *           type: string
 *         description: Filter berdasarkan nama tipe komponen.
 *       - in: query
 *         name: arah_komponen
 *         schema:
 *           type: string
 *           enum: [PEMASUKAN, POTONGAN]
 *         description: Filter berdasarkan arah komponen.
 *       - in: query
 *         name: aktif
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['true', 'false', '1', '0']
 *         description: Filter status aktif.
 *       - in: query
 *         name: kena_pajak_default
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['true', 'false', '1', '0']
 *         description: Filter default kena pajak.
 *       - in: query
 *         name: berulang_default
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['true', 'false', '1', '0']
 *         description: Filter default berulang.
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
 *           enum: [created_at, updated_at, nama_tipe_komponen, nama_komponen, arah_komponen, kena_pajak_default, berulang_default, aktif]
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
 *         description: Daftar definisi komponen payroll berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DefinisiKomponenPayroll'
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
 *       '400':
 *         description: Parameter query tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat definisi komponen payroll
 *     description: Membuat definisi komponen payroll baru. Jika ditemukan data soft delete dengan kombinasi tipe, nama, dan arah komponen yang sama, data akan dipulihkan dan diperbarui.
 *     tags: [Admin - Definisi Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_tipe_komponen_payroll
 *               - nama_komponen
 *               - arah_komponen
 *             properties:
 *               id_tipe_komponen_payroll:
 *                 type: string
 *                 maxLength: 36
 *               nama_komponen:
 *                 type: string
 *                 maxLength: 255
 *               arah_komponen:
 *                 type: string
 *                 enum: [PEMASUKAN, POTONGAN]
 *               kena_pajak_default:
 *                 type: boolean
 *                 default: false
 *               berulang_default:
 *                 type: boolean
 *                 default: false
 *               aktif:
 *                 type: boolean
 *                 default: true
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Data soft delete berhasil dipulihkan dan diperbarui.
 *       '201':
 *         description: Definisi komponen payroll berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/DefinisiKomponenPayroll'
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '409':
 *         description: Kombinasi tipe, nama, dan arah komponen sudah digunakan oleh data aktif lain.
 *       '500':
 *         description: Terjadi kesalahan server.
 * components:
 *   schemas:
 *     DefinisiKomponenPayroll:
 *       type: object
 *       properties:
 *         id_definisi_komponen_payroll:
 *           type: string
 *         id_tipe_komponen_payroll:
 *           type: string
 *         nama_komponen:
 *           type: string
 *         tipe_komponen:
 *           type: object
 *           nullable: true
 *           properties:
 *             id_tipe_komponen_payroll:
 *               type: string
 *             nama_tipe_komponen:
 *               type: string
 *             deleted_at:
 *               type: string
 *               format: date-time
 *               nullable: true
 *         arah_komponen:
 *           type: string
 *           enum: [PEMASUKAN, POTONGAN]
 *         kena_pajak_default:
 *           type: boolean
 *         berulang_default:
 *           type: boolean
 *         aktif:
 *           type: boolean
 *         catatan:
 *           type: string
 *           nullable: true
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
 *             item_payroll:
 *               type: integer
 */

const adminDefinisiKomponenPayrollDocs = {};

export default adminDefinisiKomponenPayrollDocs;
