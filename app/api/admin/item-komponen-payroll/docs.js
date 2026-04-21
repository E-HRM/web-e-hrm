/**
 * @swagger
 * tags:
 *   - name: Admin - Item Komponen Payroll
 *     description: Manajemen item komponen payroll per payroll karyawan dari panel admin.
 * /api/admin/item-komponen-payroll:
 *   get:
 *     summary: Daftar item komponen payroll
 *     description: Mengambil daftar item komponen payroll dengan filter, pencarian, sorting, dan pagination sesuai schema ItemKomponenPayroll.
 *     tags: [Admin - Item Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Cari berdasarkan nama komponen, kunci idempoten, catatan, data payroll karyawan, definisi komponen, atau pembuat.
 *       - in: query
 *         name: id_payroll_karyawan
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_periode_payroll
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_user
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_definisi_komponen_payroll
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_user_pembuat
 *         schema:
 *           type: string
 *       - in: query
 *         name: kunci_idempoten
 *         schema:
 *           type: string
 *       - in: query
 *         name: tipe_komponen
 *         schema:
 *           type: string
 *         description: Snapshot nama tipe komponen payroll pada item.
 *       - in: query
 *         name: arah_komponen
 *         schema:
 *           type: string
 *           enum: [PEMASUKAN, POTONGAN]
 *       - in: query
 *         name: status_payroll
 *         schema:
 *           type: string
 *           enum: [DRAFT, TERSIMPAN, DISETUJUI, DIBAYAR]
 *       - in: query
 *         name: kena_pajak
 *         schema:
 *           oneOf:
 *             - type: boolean
 *             - type: string
 *               enum: ['true', 'false', '1', '0']
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *       - in: query
 *         name: deletedOnly
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *           default: 0
 *       - in: query
 *         name: orderBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, kunci_idempoten, nama_komponen, tipe_komponen, arah_komponen, nominal, kena_pajak, urutan_tampil]
 *           default: urutan_tampil
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       '200':
 *         description: Daftar item komponen payroll berhasil diambil.
 *       '400':
 *         description: Filter tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '500':
 *         description: Terjadi kesalahan server.
 *   post:
 *     summary: Buat item komponen payroll
 *     description: |
 *       Membuat item komponen payroll baru. Logic bisnis yang diterapkan:
 *       - item hanya boleh dibuat pada payroll yang masih mutable (`DRAFT` / `TERSIMPAN`) dan periodenya belum `FINAL` / `TERKUNCI`.
 *       - `id_definisi_komponen_payroll` bersifat opsional. Jika dikirim, snapshot `tipe_komponen`, `arah_komponen`, `nama_komponen`, dan `kena_pajak` mengikuti definisi.
 *       - jika item dibuat manual tanpa definisi, `tipe_komponen` harus ada pada master `TipeKomponenPayroll` aktif.
 *       - `kunci_idempoten` boleh dikirim manual; jika tidak dikirim untuk item manual, sistem akan membuatkannya otomatis.
 *       - setelah item dibuat, total payroll karyawan akan dihitung ulang.
 *     tags: [Admin - Item Komponen Payroll]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id_payroll_karyawan, nominal]
 *             properties:
 *               id_payroll_karyawan:
 *                 type: string
 *               id_definisi_komponen_payroll:
 *                 type: string
 *                 nullable: true
 *               id_user_pembuat:
 *                 type: string
 *                 nullable: true
 *               kunci_idempoten:
 *                 type: string
 *               tipe_komponen:
 *                 type: string
 *                 description: Wajib jika item manual tanpa definisi.
 *               arah_komponen:
 *                 type: string
 *                 enum: [PEMASUKAN, POTONGAN]
 *                 description: Wajib jika item manual tanpa definisi.
 *               nama_komponen:
 *                 type: string
 *                 description: Wajib jika item manual tanpa definisi.
 *               nominal:
 *                 type: number
 *               kena_pajak:
 *                 type: boolean
 *                 description: Hanya dipakai untuk item manual tanpa definisi.
 *               urutan_tampil:
 *                 type: integer
 *                 minimum: 0
 *               catatan:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '201':
 *         description: Item komponen payroll berhasil dibuat.
 *       '400':
 *         description: Payload tidak valid.
 *       '401':
 *         description: Tidak terautentikasi.
 *       '403':
 *         description: Tidak memiliki akses.
 *       '409':
 *         description: Kunci idempoten duplikat atau payroll tidak mutable.
 *       '500':
 *         description: Terjadi kesalahan server.
 */
export {};
