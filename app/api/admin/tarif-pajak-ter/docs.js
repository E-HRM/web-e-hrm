/**
 * @swagger
 * tags:
 *   - name: Admin - Tarif Pajak TER
 *     description: Manajemen data tarif pajak TER dari panel admin.
 * /api/admin/tarif-pajak-ter:
 *   get:
 *     summary: Daftar tarif pajak TER
 *     description: Mengambil daftar tarif pajak TER dengan filter kode kategori pajak, periode berlaku, titik penghasilan, sorting, dan pagination.
 *     tags: [Admin - Tarif Pajak TER]
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
 *         name: kode_kategori_pajak
 *         schema:
 *           type: string
 *           example: TK_0
 *         description: Filter berdasarkan kode kategori pajak.
 *       - in: query
 *         name: penghasilan
 *         schema:
 *           type: string
 *           example: '7500000.00'
 *         description: Ambil bracket tarif yang mencakup nilai penghasilan tertentu.
 *       - in: query
 *         name: berlakuMulaiFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas bawah filter `berlaku_mulai`.
 *       - in: query
 *         name: berlakuMulaiTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas atas filter `berlaku_mulai`.
 *       - in: query
 *         name: berlakuSampaiFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas bawah filter `berlaku_sampai`.
 *       - in: query
 *         name: berlakuSampaiTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Batas atas filter `berlaku_sampai`.
 *       - in: query
 *         name: aktifPada
 *         schema:
 *           type: string
 *           format: date
 *         description: Ambil data yang aktif pada tanggal tertentu.
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
 *           enum: [created_at, updated_at, kode_kategori_pajak, penghasilan_dari, penghasilan_sampai, persen_tarif, berlaku_mulai, berlaku_sampai]
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
 *         description: Daftar tarif pajak TER berhasil diambil.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TarifPajakTER'
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
 *     summary: Buat tarif pajak TER
 *     description: Menambahkan data tarif pajak TER baru. Sistem akan menolak data jika kode kategori pajak, periode berlaku, dan rentang penghasilan saling overlap dengan data aktif lain.
 *     tags: [Admin - Tarif Pajak TER]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - kode_kategori_pajak
 *               - penghasilan_dari
 *               - persen_tarif
 *               - berlaku_mulai
 *             properties:
 *               kode_kategori_pajak:
 *                 type: string
 *                 example: TK_0
 *               penghasilan_dari:
 *                 type: string
 *                 example: '0.00'
 *               penghasilan_sampai:
 *                 type: string
 *                 nullable: true
 *                 example: '5400000.00'
 *                 description: Nullable. Kosong/null berarti tidak memiliki batas atas.
 *               persen_tarif:
 *                 type: string
 *                 example: '0.2500'
 *                 description: Persentase tarif dalam satuan persen, rentang 0 sampai 100.
 *               berlaku_mulai:
 *                 type: string
 *                 format: date
 *               berlaku_sampai:
 *                 type: string
 *                 format: date
 *                 nullable: true
 *                 description: Nullable. Kosong/null berarti berlaku tanpa batas akhir.
 *     responses:
 *       '201':
 *         description: Tarif pajak TER berhasil dibuat.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/TarifPajakTER'
 *       '400':
 *         description: Payload tidak valid atau data bentrok dengan bracket lain.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 * components:
 *   schemas:
 *     TarifPajakTER:
 *       type: object
 *       properties:
 *         id_tarif_pajak_ter:
 *           type: string
 *         kode_kategori_pajak:
 *           type: string
 *           example: TK_0
 *         penghasilan_dari:
 *           type: string
 *           example: '0.00'
 *         penghasilan_sampai:
 *           type: string
 *           nullable: true
 *           example: '5400000.00'
 *         persen_tarif:
 *           type: string
 *           example: '0.2500'
 *         berlaku_mulai:
 *           type: string
 *           format: date
 *         berlaku_sampai:
 *           type: string
 *           format: date
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
 */

const adminTarifPajakTERDocs = {};

export default adminTarifPajakTERDocs;
