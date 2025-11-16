/**
 * 利用者状態管理ストア
 * Svelte 5 Rune を使用した利用者データの管理
 */

import type { User, UserFilter, UserSortOption } from '$lib/types/user';

export class UserStore {
	// 基本状態
	users = $state<User[]>([]);
	selectedUser = $state<User | null>(null);
	isLoading = $state(false);
	error = $state<string | null>(null);

	// フィルタリング・検索状態
	filter = $state<UserFilter>({});
	sortOption = $state<UserSortOption>({ field: 'name', direction: 'asc' });
	searchTerm = $state('');

	// ページネーション状態
	currentPage = $state(1);
	itemsPerPage = $state(20);

	// 派生状態 - フィルタリングされた利用者リスト
	filteredUsers = $derived.by(() => {
		let result = this.users.slice();

		// 検索フィルタ
		if (this.searchTerm.trim()) {
			const term = this.searchTerm.toLowerCase();
			result = result.filter(
				(user) =>
					user.name.toLowerCase().includes(term) ||
					user.nameKana.toLowerCase().includes(term) ||
					user.id.toLowerCase().includes(term)
			);
		}

		// 要介護度フィルタ
		if (this.filter.careLevel && this.filter.careLevel.length > 0) {
			result = result.filter((user) => this.filter.careLevel!.includes(user.careLevel));
		}

		// 性別フィルタ
		if (this.filter.gender && this.filter.gender.length > 0) {
			result = result.filter((user) => this.filter.gender!.includes(user.gender));
		}

		// 年齢範囲フィルタ
		if (this.filter.ageRange) {
			const now = new Date();
			result = result.filter((user) => {
				const age = now.getFullYear() - user.birthDate.getFullYear();
				const { min, max } = this.filter.ageRange!;
				return age >= min && age <= max;
			});
		}

		// アクティブ状態フィルタ
		if (this.filter.status && this.filter.status.length > 0) {
			result = result.filter((user) => {
				const status = user.isActive ? 'active' : 'inactive';
				return this.filter.status!.includes(status);
			});
		}

		return result;
	});

	// 派生状態 - ソートされた利用者リスト
	sortedUsers = $derived.by(() => {
		const users = this.filteredUsers.slice();
		const { field, direction } = this.sortOption;

		return users.sort((a, b) => {
			let aValue = a[field];
			let bValue = b[field];

			// 日付の場合は数値に変換
			if (aValue instanceof Date) {
				aValue = aValue.getTime();
				bValue = (bValue as Date).getTime();
			}

			// 文字列の場合は小文字で比較
			if (typeof aValue === 'string') {
				aValue = aValue.toLowerCase();
				bValue = (bValue as string).toLowerCase();
			}

			if (!aValue || !bValue) return 0;

			if (aValue < bValue) return direction === 'asc' ? -1 : 1;
			if (aValue > bValue) return direction === 'asc' ? 1 : -1;
			return 0;
		});
	});

	// 派生状態 - ページネーションされた利用者リスト
	paginatedUsers = $derived.by(() => {
		const startIndex = (this.currentPage - 1) * this.itemsPerPage;
		const endIndex = startIndex + this.itemsPerPage;
		return this.sortedUsers.slice(startIndex, endIndex);
	});

	// 派生状態 - 総ページ数
	totalPages = $derived(Math.ceil(this.sortedUsers.length / this.itemsPerPage));

	// 派生状態 - 統計情報
	statistics = $derived.by(() => {
		const total = this.users.length;
		const active = this.users.filter((u) => u.isActive).length;
		const byGender = this.users.reduce(
			(acc, user) => {
				acc[user.gender] = (acc[user.gender] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);
		const byCareLevel = this.users.reduce(
			(acc, user) => {
				acc[user.careLevel] = (acc[user.careLevel] || 0) + 1;
				return acc;
			},
			{} as Record<number, number>
		);

		return {
			total,
			active,
			inactive: total - active,
			byGender,
			byCareLevel
		};
	});

	// CRUD操作

	/**
	 * 全利用者データを読み込み
	 */
	async loadUsers(): Promise<void> {
		this.isLoading = true;
		this.error = null;

		try {
			// TODO: 実際のAPI呼び出しに置き換え
			// const response = await fetch('/api/users');
			// const users = await response.json();

			// 仮のデータ（開発用）
			const mockUsers: User[] = [
				{
					id: '1',
					name: '田中太郎',
					nameKana: 'タナカタロウ',
					birthDate: new Date('1940-05-15'),
					gender: 'male',
					address: {
						postalCode: '123-4567',
						prefecture: '東京都',
						city: '新宿区',
						street: '西新宿1-1-1'
					},
					emergencyContact: {
						name: '田中花子',
						relationship: '娘',
						phone: '090-1234-5678',
						email: 'hanako@example.com'
					},
					medicalInfo: {
						allergies: ['ペニシリン'],
						medications: [],
						conditions: ['高血圧', '糖尿病'],
						restrictions: ['塩分制限']
					},
					careLevel: 3,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-01-15'),
					isActive: true,
					createdAt: new Date('2023-01-15'),
					updatedAt: new Date('2023-01-15')
				},
				{
					id: '2',
					name: '佐藤花子',
					nameKana: 'サトウハナコ',
					birthDate: new Date('1935-08-20'),
					gender: 'female',
					address: {
						postalCode: '456-7890',
						prefecture: '大阪府',
						city: '大阪市',
						street: '梅田1-1-1'
					},
					emergencyContact: {
						name: '佐藤次郎',
						relationship: '息子',
						phone: '090-9876-5432'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['認知症'],
						restrictions: []
					},
					careLevel: 4,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2022-06-10'),
					isActive: true,
					createdAt: new Date('2022-06-10'),
					updatedAt: new Date('2022-06-10')
				},
				{
					id: '3',
					name: '鈴木一郎',
					nameKana: 'スズキイチロウ',
					birthDate: new Date('1945-12-03'),
					gender: 'male',
					address: {
						postalCode: '789-0123',
						prefecture: '愛知県',
						city: '名古屋市',
						street: '栄3-4-5'
					},
					emergencyContact: {
						name: '鈴木美子',
						relationship: '妻',
						phone: '080-1111-2222',
						email: 'yoshiko@example.com'
					},
					medicalInfo: {
						allergies: ['そば', '卵'],
						medications: [],
						conditions: ['心疾患', '高血圧', '関節炎'],
						restrictions: ['運動制限']
					},
					careLevel: 2,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-09-01'),
					isActive: true,
					createdAt: new Date('2023-09-01'),
					updatedAt: new Date('2023-09-01')
				},
				{
					id: '4',
					name: '山田美子',
					nameKana: 'ヤマダヨシコ',
					birthDate: new Date('1938-03-18'),
					gender: 'female',
					address: {
						postalCode: '321-6540',
						prefecture: '福岡県',
						city: '福岡市',
						street: '天神2-8-1'
					},
					emergencyContact: {
						name: '山田健太',
						relationship: '息子',
						phone: '070-5555-6666'
					},
					medicalInfo: {
						allergies: ['薬物アレルギー'],
						medications: [],
						conditions: ['糖尿病', '腎疾患', '視力障害'],
						restrictions: ['食事制限', '水分制限']
					},
					careLevel: 5,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2021-11-20'),
					isActive: true,
					createdAt: new Date('2021-11-20'),
					updatedAt: new Date('2021-11-20')
				},
				{
					id: '5',
					name: '高橋正男',
					nameKana: 'タカハシマサオ',
					birthDate: new Date('1950-07-25'),
					gender: 'male',
					address: {
						postalCode: '654-3210',
						prefecture: '北海道',
						city: '札幌市',
						street: '中央区大通1-1-1'
					},
					emergencyContact: {
						name: '高橋恵子',
						relationship: '娘',
						phone: '090-7777-8888',
						email: 'keiko@example.com'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['軽度認知症'],
						restrictions: []
					},
					careLevel: 1,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2024-01-10'),
					isActive: true,
					createdAt: new Date('2024-01-10'),
					updatedAt: new Date('2024-01-10')
				},
				{
					id: '6',
					name: '伊藤静子',
					nameKana: 'イトウシズコ',
					birthDate: new Date('1942-11-12'),
					gender: 'female',
					address: {
						postalCode: '987-6543',
						prefecture: '宮城県',
						city: '仙台市',
						street: '青葉区一番町1-1-1'
					},
					emergencyContact: {
						name: '伊藤大輔',
						relationship: '息子',
						phone: '080-9999-0000'
					},
					medicalInfo: {
						allergies: ['花粉'],
						medications: [],
						conditions: ['骨粗鬆症', '高血圧'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-04-15'),
					isActive: false,
					createdAt: new Date('2023-04-15'),
					updatedAt: new Date('2023-04-15')
				},
				{
					id: '7',
					name: '渡辺幸子',
					nameKana: 'ワタナベサチコ',
					birthDate: new Date('1943-02-22'),
					gender: 'female',
					address: {
						postalCode: '135-0063',
						prefecture: '東京都',
						city: '江東区',
						street: '有明2-3-4'
					},
					emergencyContact: {
						name: '渡辺健一',
						relationship: '息子',
						phone: '090-3333-4444',
						email: 'kenichi.w@example.com'
					},
					medicalInfo: {
						allergies: [],
						medications: [
							{
								id: 'med-1',
								name: 'アムロジピン',
								dosage: '5mg',
								frequency: '1日1回',
								startDate: new Date('2023-01-10')
							}
						],
						conditions: ['高血圧', '骨粗鬆症'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [
						{
							id: 'note-1',
							authorId: 'staff-001',
							authorName: '看護師A',
							content: '歩行補助が必要',
							category: 'care-plan',
							isImportant: true,
							createdAt: new Date('2023-07-15'),
							updatedAt: new Date('2023-07-15')
						}
					],
					admissionDate: new Date('2023-07-15'),
					isActive: true,
					createdAt: new Date('2023-07-15'),
					updatedAt: new Date('2023-07-15')
				},
				{
					id: '8',
					name: '小林清',
					nameKana: 'コバヤシキヨシ',
					birthDate: new Date('1947-04-11'),
					gender: 'male',
					address: {
						postalCode: '222-0036',
						prefecture: '神奈川県',
						city: '横浜市',
						street: '港北区新横浜1-5-7'
					},
					emergencyContact: {
						name: '小林洋子',
						relationship: '妻',
						phone: '090-5555-6667'
					},
					medicalInfo: {
						allergies: [],
						medications: [
							{
								id: 'med-2',
								name: 'メトホルミン',
								dosage: '500mg',
								frequency: '1日2回',
								startDate: new Date('2022-07-01')
							}
						],
						conditions: ['糖尿病'],
						restrictions: ['甘味制限']
					},
					careLevel: 3,
					familyMembers: [],
					notes: [
						{
							id: 'note-2',
							authorId: 'staff-002',
							authorName: '介護士B',
							content: '歩行補助が必要',
							category: 'care-plan',
							isImportant: false,
							createdAt: new Date('2022-10-05'),
							updatedAt: new Date('2022-10-05')
						}
					],
					admissionDate: new Date('2022-10-05'),
					isActive: true,
					createdAt: new Date('2022-10-05'),
					updatedAt: new Date('2022-10-05')
				},
				{
					id: '9',
					name: '松本裕子',
					nameKana: 'マツモトユウコ',
					birthDate: new Date('1939-09-23'),
					gender: 'female',
					address: {
						postalCode: '001-0021',
						prefecture: '北海道',
						city: '旭川市',
						street: '神居3-7-11'
					},
					emergencyContact: {
						name: '松本茂',
						relationship: '夫',
						phone: '080-2222-3333'
					},
					medicalInfo: {
						allergies: ['乳製品'],
						medications: [],
						conditions: ['腎疾患'],
						restrictions: ['水分制限']
					},
					careLevel: 4,
					familyMembers: [],
					notes: [
						{
							id: 'note-3',
							authorId: 'staff-003',
							authorName: '看護師C',
							content: '寝たきり',
							category: 'medical',
							isImportant: true,
							createdAt: new Date('2021-03-12'),
							updatedAt: new Date('2021-03-12')
						}
					],
					admissionDate: new Date('2021-03-12'),
					isActive: true,
					createdAt: new Date('2021-03-12'),
					updatedAt: new Date('2021-03-12')
				},
				{
					id: '10',
					name: '斎藤隆',
					nameKana: 'サイトウタカシ',
					birthDate: new Date('1952-12-14'),
					gender: 'male',
					address: {
						postalCode: '540-0011',
						prefecture: '大阪府',
						city: '大阪市',
						street: '中央区大道1-9-22'
					},
					emergencyContact: {
						name: '斎藤明美',
						relationship: '妻',
						phone: '080-4444-5555',
						email: 'akemi.s@example.com'
					},
					medicalInfo: {
						allergies: ['イブプロフェン'],
						medications: [
							{
								id: 'med-3',
								name: 'リドカイン',
								dosage: '1%注射液',
								frequency: '週1回',
								startDate: new Date('2024-08-25')
							}
						],
						conditions: ['関節炎'],
						restrictions: ['激しい運動を避ける']
					},
					careLevel: 2,
					familyMembers: [],
					notes: [
						{
							id: 'note-4',
							authorId: 'staff-004',
							authorName: '理学療法士D',
							content: '週1でリハビリ有',
							category: 'care-plan',
							isImportant: false,
							createdAt: new Date('2024-08-25'),
							updatedAt: new Date('2024-08-25')
						}
					],
					admissionDate: new Date('2024-08-25'),
					isActive: false,
					createdAt: new Date('2024-08-25'),
					updatedAt: new Date('2024-08-25')
				},
				{
					id: '11',
					name: '村上道子',
					nameKana: 'ムラカミミチコ',
					birthDate: new Date('1941-06-14'),
					gender: 'female',
					address: {
						postalCode: '400-0023',
						prefecture: '山梨県',
						city: '甲府市',
						street: '中央1-2-3'
					},
					emergencyContact: {
						name: '村上健太',
						relationship: '息子',
						phone: '080-1112-2345'
					},
					medicalInfo: {
						allergies: ['花粉'],
						medications: [
							{
								id: 'med-4',
								name: 'シロスタゾール',
								dosage: '50mg',
								frequency: '1日2回',
								startDate: new Date('2023-09-10')
							}
						],
						conditions: ['高血圧', '動脈硬化'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [
						{
							id: 'note-5',
							authorId: 'staff-001',
							authorName: '看護師E',
							content: '外出希望あり',
							category: 'general',
							isImportant: false,
							createdAt: new Date('2023-09-11'),
							updatedAt: new Date('2023-09-11')
						}
					],
					admissionDate: new Date('2023-09-10'),
					isActive: true,
					createdAt: new Date('2023-09-10'),
					updatedAt: new Date('2023-09-10')
				},
				{
					id: '12',
					name: '加藤正義',
					nameKana: 'カトウマサヨシ',
					birthDate: new Date('1944-02-08'),
					gender: 'male',
					address: {
						postalCode: '630-0041',
						prefecture: '奈良県',
						city: '奈良市',
						street: '東寺林町5-6'
					},
					emergencyContact: {
						name: '加藤宏美',
						relationship: '妻',
						phone: '090-1122-3333'
					},
					medicalInfo: {
						allergies: [],
						medications: [
							{
								id: 'med-5',
								name: 'アトルバスタチン',
								dosage: '10mg',
								frequency: '1日1回',
								startDate: new Date('2023-02-10')
							}
						],
						conditions: ['脂質異常症'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [
						{
							id: 'note-6',
							authorId: 'staff-006',
							authorName: '看護師F',
							content: '服薬管理が必要',
							category: 'medical',
							isImportant: true,
							createdAt: new Date('2023-02-11'),
							updatedAt: new Date('2023-02-11')
						}
					],
					admissionDate: new Date('2023-02-10'),
					isActive: true,
					createdAt: new Date('2023-02-10'),
					updatedAt: new Date('2023-02-10')
				},
				{
					id: '13',
					name: '島田彰',
					nameKana: 'シマダアキラ',
					birthDate: new Date('1937-08-30'),
					gender: 'male',
					address: {
						postalCode: '920-0014',
						prefecture: '石川県',
						city: '金沢市',
						street: '本町3-5-1'
					},
					emergencyContact: {
						name: '島田早苗',
						relationship: '娘',
						phone: '090-2223-5432'
					},
					medicalInfo: {
						allergies: ['甲殻類'],
						medications: [],
						conditions: ['慢性腎臓病'],
						restrictions: ['水分制限']
					},
					careLevel: 4,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2022-05-20'),
					isActive: true,
					createdAt: new Date('2022-05-20'),
					updatedAt: new Date('2022-05-20')
				},
				{
					id: '14',
					name: '藤原雅子',
					nameKana: 'フジワラマサコ',
					birthDate: new Date('1948-01-17'),
					gender: 'female',
					address: {
						postalCode: '862-0950',
						prefecture: '熊本県',
						city: '熊本市',
						street: '水前寺1-9-2'
					},
					emergencyContact: {
						name: '藤原洋一',
						relationship: '夫',
						phone: '080-3333-4444'
					},
					medicalInfo: {
						allergies: [],
						medications: [
							{
								id: 'med-6',
								name: 'メマリー',
								dosage: '10mg',
								frequency: '夕食後',
								startDate: new Date('2024-01-10')
							}
						],
						conditions: ['認知症'],
						restrictions: []
					},
					careLevel: 3,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2024-01-10'),
					isActive: true,
					createdAt: new Date('2024-01-10'),
					updatedAt: new Date('2024-01-10')
				},
				{
					id: '15',
					name: '本田康生',
					nameKana: 'ホンダヤスオ',
					birthDate: new Date('1936-11-29'),
					gender: 'male',
					address: {
						postalCode: '813-0044',
						prefecture: '福岡県',
						city: '福岡市',
						street: '東区箱崎1-20-11'
					},
					emergencyContact: {
						name: '本田恵美',
						relationship: '孫',
						phone: '080-4445-6660'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['脳梗塞後遺症'],
						restrictions: ['食事制限']
					},
					careLevel: 5,
					familyMembers: [],
					notes: [
						{
							id: 'note-7',
							authorId: 'staff-007',
							authorName: '看護師G',
							content: '嚥下障害注意',
							category: 'medical',
							isImportant: true,
							createdAt: new Date('2023-06-01'),
							updatedAt: new Date('2023-06-01')
						}
					],
					admissionDate: new Date('2023-06-01'),
					isActive: true,
					createdAt: new Date('2023-06-01'),
					updatedAt: new Date('2023-06-01')
				},
				{
					id: '16',
					name: '田村彩',
					nameKana: 'タムラアヤ',
					birthDate: new Date('1952-03-10'),
					gender: 'female',
					address: {
						postalCode: '430-0945',
						prefecture: '静岡県',
						city: '浜松市',
						street: '中区元城町12-3'
					},
					emergencyContact: {
						name: '田村壮一',
						relationship: '夫',
						phone: '080-5551-7777',
						email: 'soichi@example.com'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['骨粗鬆症'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2022-10-10'),
					isActive: true,
					createdAt: new Date('2022-10-10'),
					updatedAt: new Date('2022-10-10')
				},
				{
					id: '17',
					name: '佐々木進',
					nameKana: 'ササキススム',
					birthDate: new Date('1934-05-18'),
					gender: 'male',
					address: {
						postalCode: '890-0051',
						prefecture: '鹿児島県',
						city: '鹿児島市',
						street: '中央町8-15'
					},
					emergencyContact: {
						name: '佐々木伸子',
						relationship: '娘',
						phone: '090-6789-1234'
					},
					medicalInfo: {
						allergies: ['薬物アレルギー'],
						medications: [
							{
								id: 'med-7',
								name: 'アセトアミノフェン',
								dosage: '300mg',
								frequency: '1日3回',
								startDate: new Date('2023-03-10')
							}
						],
						conditions: ['関節リウマチ'],
						restrictions: ['運動制限']
					},
					careLevel: 1,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-03-12'),
					isActive: true,
					createdAt: new Date('2023-03-12'),
					updatedAt: new Date('2023-03-12')
				},
				{
					id: '18',
					name: '山下久美',
					nameKana: 'ヤマシタクミ',
					birthDate: new Date('1949-09-07'),
					gender: 'female',
					address: {
						postalCode: '950-0941',
						prefecture: '新潟県',
						city: '新潟市',
						street: '中央区鳥屋野南2-7-8'
					},
					emergencyContact: {
						name: '山下達也',
						relationship: '夫',
						phone: '080-2222-8889'
					},
					medicalInfo: {
						allergies: ['卵'],
						medications: [],
						conditions: ['高血圧', '貧血'],
						restrictions: []
					},
					careLevel: 3,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2022-11-10'),
					isActive: true,
					createdAt: new Date('2022-11-10'),
					updatedAt: new Date('2022-11-10')
				},
				{
					id: '19',
					name: '横山良子',
					nameKana: 'ヨコヤマヨシコ',
					birthDate: new Date('1942-04-05'),
					gender: 'female',
					address: {
						postalCode: '980-0013',
						prefecture: '宮城県',
						city: '仙台市',
						street: '青葉区花京院5-6-1'
					},
					emergencyContact: {
						name: '横山誠',
						relationship: '息子',
						phone: '080-3333-2442'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['認知症', '高血圧'],
						restrictions: []
					},
					careLevel: 4,
					familyMembers: [],
					notes: [
						{
							id: 'note-8',
							authorId: 'staff-008',
							authorName: '看護師H',
							content: '日中徘徊傾向あり',
							category: 'behavioral',
							isImportant: true,
							createdAt: new Date('2023-04-07'),
							updatedAt: new Date('2023-04-07')
						}
					],
					admissionDate: new Date('2023-04-05'),
					isActive: true,
					createdAt: new Date('2023-04-05'),
					updatedAt: new Date('2023-04-05')
				},
				{
					id: '20',
					name: '石田武',
					nameKana: 'イシダタケシ',
					birthDate: new Date('1935-12-31'),
					gender: 'male',
					address: {
						postalCode: '850-0007',
						prefecture: '長崎県',
						city: '長崎市',
						street: '立山1-7-2'
					},
					emergencyContact: {
						name: '石田彩子',
						relationship: '妻',
						phone: '090-6666-2345'
					},
					medicalInfo: {
						allergies: [],
						medications: [
							{
								id: 'med-8',
								name: 'ドパミンアゴニスト',
								dosage: '2mg',
								frequency: '朝食後',
								startDate: new Date('2024-01-05')
							}
						],
						conditions: ['パーキンソン病'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2024-01-05'),
					isActive: true,
					createdAt: new Date('2024-01-05'),
					updatedAt: new Date('2024-01-05')
				},
				{
					id: '21',
					name: '永井文子',
					nameKana: 'ナガイフミコ',
					birthDate: new Date('1940-10-20'),
					gender: 'female',
					address: {
						postalCode: '760-0001',
						prefecture: '香川県',
						city: '高松市',
						street: '中央町5-8'
					},
					emergencyContact: {
						name: '永井俊之',
						relationship: '息子',
						phone: '080-1122-5566'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['骨粗鬆症'],
						restrictions: []
					},
					careLevel: 3,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-10-21'),
					isActive: true,
					createdAt: new Date('2023-10-21'),
					updatedAt: new Date('2023-10-21')
				},
				{
					id: '22',
					name: '三浦太',
					nameKana: 'ミウラフトシ',
					birthDate: new Date('1938-03-02'),
					gender: 'male',
					address: {
						postalCode: '064-0809',
						prefecture: '北海道',
						city: '札幌市',
						street: '中央区南9条西2-4'
					},
					emergencyContact: {
						name: '三浦実',
						relationship: '妻',
						phone: '090-7654-3210'
					},
					medicalInfo: {
						allergies: ['アスピリン'],
						medications: [
							{
								id: 'med-9',
								name: 'イグザレルト',
								dosage: '15mg',
								frequency: '1日1回',
								startDate: new Date('2022-03-01')
							}
						],
						conditions: ['心房細動'],
						restrictions: ['運動制限']
					},
					careLevel: 2,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2022-03-02'),
					isActive: true,
					createdAt: new Date('2022-03-02'),
					updatedAt: new Date('2022-03-02')
				},
				{
					id: '23',
					name: '中村美咲',
					nameKana: 'ナカムラミサキ',
					birthDate: new Date('1951-07-18'),
					gender: 'female',
					address: {
						postalCode: '701-0205',
						prefecture: '岡山県',
						city: '岡山市',
						street: '南区浦安南町12-34'
					},
					emergencyContact: {
						name: '中村修',
						relationship: '夫',
						phone: '080-5567-2354'
					},
					medicalInfo: {
						allergies: ['ラテックス'],
						medications: [],
						conditions: ['糖尿病'],
						restrictions: ['甘味制限']
					},
					careLevel: 4,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-07-20'),
					isActive: true,
					createdAt: new Date('2023-07-20'),
					updatedAt: new Date('2023-07-20')
				},
				{
					id: '24',
					name: '大西健',
					nameKana: 'オオニシタケシ',
					birthDate: new Date('1939-11-03'),
					gender: 'male',
					address: {
						postalCode: '990-0031',
						prefecture: '山形県',
						city: '山形市',
						street: '十日町1-13-2'
					},
					emergencyContact: {
						name: '大西奈美',
						relationship: '妻',
						phone: '080-6789-9876'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['慢性閉塞性肺疾患'],
						restrictions: []
					},
					careLevel: 3,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2022-11-10'),
					isActive: true,
					createdAt: new Date('2022-11-10'),
					updatedAt: new Date('2022-11-10')
				},
				{
					id: '25',
					name: '河合美智子',
					nameKana: 'カワイミチコ',
					birthDate: new Date('1946-06-15'),
					gender: 'female',
					address: {
						postalCode: '500-8803',
						prefecture: '岐阜県',
						city: '岐阜市',
						street: '大洞町1-3-12'
					},
					emergencyContact: {
						name: '河合孝一',
						relationship: '息子',
						phone: '070-4445-1256'
					},
					medicalInfo: {
						allergies: ['ダニ'],
						medications: [
							{
								id: 'med-10',
								name: 'ドネペジル',
								dosage: '5mg',
								frequency: '夕食後',
								startDate: new Date('2022-12-01')
							}
						],
						conditions: ['認知症'],
						restrictions: []
					},
					careLevel: 4,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2022-12-02'),
					isActive: true,
					createdAt: new Date('2022-12-02'),
					updatedAt: new Date('2022-12-02')
				},
				{
					id: '26',
					name: '松井昇',
					nameKana: 'マツイノボル',
					birthDate: new Date('1938-09-28'),
					gender: 'male',
					address: {
						postalCode: '880-0834',
						prefecture: '宮崎県',
						city: '宮崎市',
						street: '新城町8-14'
					},
					emergencyContact: {
						name: '松井優子',
						relationship: '妻',
						phone: '080-5559-3334'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['高血圧'],
						restrictions: ['塩分制限']
					},
					careLevel: 1,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-09-28'),
					isActive: true,
					createdAt: new Date('2023-09-28'),
					updatedAt: new Date('2023-09-28')
				},
				{
					id: '27',
					name: '酒井弘',
					nameKana: 'サカイヒロシ',
					birthDate: new Date('1952-05-23'),
					gender: 'male',
					address: {
						postalCode: '920-0376',
						prefecture: '石川県',
						city: '金沢市',
						street: '花里町14-8'
					},
					emergencyContact: {
						name: '酒井亮',
						relationship: '息子',
						phone: '080-4442-1567'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['前立腺肥大症'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-05-23'),
					isActive: true,
					createdAt: new Date('2023-05-23'),
					updatedAt: new Date('2023-05-23')
				},
				{
					id: '28',
					name: '平田絵里',
					nameKana: 'ヒラタエリ',
					birthDate: new Date('1943-04-11'),
					gender: 'female',
					address: {
						postalCode: '803-0818',
						prefecture: '福岡県',
						city: '北九州市',
						street: '小倉北区木町5-3-8'
					},
					emergencyContact: {
						name: '平田一郎',
						relationship: '息子',
						phone: '080-5541-6598'
					},
					medicalInfo: {
						allergies: [],
						medications: [
							{
								id: 'med-11',
								name: 'ロサルタン',
								dosage: '25mg',
								frequency: '1日1回',
								startDate: new Date('2023-04-15')
							}
						],
						conditions: ['高血圧'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [
						{
							id: 'note-9',
							authorId: 'staff-009',
							authorName: '看護師I',
							content: '服薬忘れやすい',
							category: 'medical',
							isImportant: true,
							createdAt: new Date('2023-04-15'),
							updatedAt: new Date('2023-04-15')
						}
					],
					admissionDate: new Date('2023-04-11'),
					isActive: true,
					createdAt: new Date('2023-04-11'),
					updatedAt: new Date('2023-04-11')
				},
				{
					id: '29',
					name: '上野絵美',
					nameKana: 'ウエノエミ',
					birthDate: new Date('1950-01-30'),
					gender: 'female',
					address: {
						postalCode: '600-8305',
						prefecture: '京都府',
						city: '京都市',
						street: '下京区猪熊通五条下ル2-7'
					},
					emergencyContact: {
						name: '上野大輔',
						relationship: '夫',
						phone: '090-8888-2365'
					},
					medicalInfo: {
						allergies: [],
						medications: [],
						conditions: ['高脂血症'],
						restrictions: []
					},
					careLevel: 2,
					familyMembers: [],
					notes: [],
					admissionDate: new Date('2023-01-30'),
					isActive: true,
					createdAt: new Date('2023-01-30'),
					updatedAt: new Date('2023-01-30')
				},
				{
					id: '30',
					name: '西村晋',
					nameKana: 'ニシムラススム',
					birthDate: new Date('1937-06-19'),
					gender: 'male',
					address: {
						postalCode: '670-0886',
						prefecture: '兵庫県',
						city: '姫路市',
						street: '砥堀町1-19'
					},
					emergencyContact: {
						name: '西村幸子',
						relationship: '妻',
						phone: '080-2367-8765'
					},
					medicalInfo: {
						allergies: ['タマゴ'],
						medications: [
							{
								id: 'med-12',
								name: 'エンレスト',
								dosage: '100mg',
								frequency: '朝・夕食後',
								startDate: new Date('2024-06-01')
							}
						],
						conditions: ['心不全'],
						restrictions: ['塩分制限']
					},
					careLevel: 4,
					familyMembers: [],
					notes: [
						{
							id: 'note-10',
							authorId: 'staff-010',
							authorName: '看護師J',
							content: '浮腫症状注意',
							category: 'medical',
							isImportant: true,
							createdAt: new Date('2024-06-01'),
							updatedAt: new Date('2024-06-01')
						}
					],
					admissionDate: new Date('2024-06-01'),
					isActive: true,
					createdAt: new Date('2024-06-01'),
					updatedAt: new Date('2024-06-01')
				}
			];

			this.users = mockUsers;
		} catch (err) {
			this.error = err instanceof Error ? err.message : '利用者データの読み込みに失敗しました';
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * 利用者を作成
	 */
	async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
		this.isLoading = true;
		this.error = null;

		try {
			// TODO: 実際のAPI呼び出しに置き換え
			const newUser: User = {
				...userData,
				id: Date.now().toString(),
				createdAt: new Date(),
				updatedAt: new Date()
			};

			this.users.push(newUser);
			return newUser;
		} catch (err) {
			this.error = err instanceof Error ? err.message : '利用者の作成に失敗しました';
			throw err;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * 利用者を更新
	 */
	async updateUser(id: string, updates: Partial<User>): Promise<User> {
		this.isLoading = true;
		this.error = null;

		try {
			const userIndex = this.users.findIndex((u) => u.id === id);
			if (userIndex === -1) {
				throw new Error('利用者が見つかりません');
			}

			const updatedUser: User = {
				...this.users[userIndex],
				...updates,
				updatedAt: new Date()
			};

			// TODO: 実際のAPI呼び出しに置き換え
			// await fetch(`/api/users/${id}`, {
			//   method: 'PUT',
			//   headers: { 'Content-Type': 'application/json' },
			//   body: JSON.stringify(updatedUser)
			// });

			// 少し遅延を追加してリアルなAPI呼び出しをシミュレート
			await new Promise((resolve) => setTimeout(resolve, 500));

			this.users[userIndex] = updatedUser;

			// 選択中の利用者も更新
			if (this.selectedUser?.id === id) {
				this.selectedUser = updatedUser;
			}

			return updatedUser;
		} catch (err) {
			this.error = err instanceof Error ? err.message : '利用者の更新に失敗しました';
			throw err;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * 利用者を削除（論理削除）
	 */
	async deleteUser(id: string): Promise<void> {
		this.isLoading = true;
		this.error = null;

		try {
			await this.updateUser(id, { isActive: false });
		} catch (err) {
			this.error = err instanceof Error ? err.message : '利用者の削除に失敗しました';
			throw err;
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * 利用者を選択
	 */
	selectUser(user: User | null): void {
		this.selectedUser = user;
	}

	/**
	 * 検索条件を設定
	 */
	setSearchTerm(term: string): void {
		this.searchTerm = term;
		this.currentPage = 1; // 検索時はページをリセット
	}

	/**
	 * フィルタを設定
	 */
	setFilter(filter: Partial<UserFilter>): void {
		this.filter = { ...this.filter, ...filter };
		this.currentPage = 1; // フィルタ変更時はページをリセット
	}

	/**
	 * フィルタをクリア
	 */
	clearFilter(): void {
		this.filter = {};
		this.searchTerm = '';
		this.currentPage = 1;
	}

	/**
	 * ソート条件を設定
	 */
	setSortOption(sortOption: UserSortOption): void {
		this.sortOption = sortOption;
	}

	/**
	 * ページを変更
	 */
	setPage(page: number): void {
		if (page >= 1 && page <= this.totalPages) {
			this.currentPage = page;
		}
	}

	/**
	 * ページサイズを変更
	 */
	setItemsPerPage(itemsPerPage: number): void {
		this.itemsPerPage = itemsPerPage;
		this.currentPage = 1; // ページサイズ変更時はページをリセット
	}

	/**
	 * エラーをクリア
	 */
	clearError(): void {
		this.error = null;
	}
}

// シングルトンインスタンス
export const userStore = new UserStore();
