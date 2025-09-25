import type { Config } from '@master/css';

export default {
    variables: {
        color: {
            // 既存のimemoカラー
            imemo: {
                primary: "rgba(231, 221, 207, 1)",
                secondary: "rgba(214, 198, 171, 1)",
                tertiary: "rgba(134, 106, 80, 1)",
                text: "rgba(81, 62, 62, 1)",
                accent: {
                    pink: "rgba(254, 186, 170, 1)",
                    green: "rgba(163, 209, 159, 1)",
                }
            },
            // 介護施設向けカラーパレット
            care: {
                // プライマリカラー（安心感のある青系）
                primary: {
                    50: "rgba(239, 246, 255, 1)",
                    100: "rgba(219, 234, 254, 1)",
                    200: "rgba(191, 219, 254, 1)",
                    300: "rgba(147, 197, 253, 1)",
                    400: "rgba(96, 165, 250, 1)",
                    500: "rgba(59, 130, 246, 1)",
                    600: "rgba(37, 99, 235, 1)",
                    700: "rgba(29, 78, 216, 1)",
                    800: "rgba(30, 64, 175, 1)",
                    900: "rgba(30, 58, 138, 1)",
                },
                // セカンダリカラー（温かみのある緑系）
                secondary: {
                    50: "rgba(240, 253, 244, 1)",
                    100: "rgba(220, 252, 231, 1)",
                    200: "rgba(187, 247, 208, 1)",
                    300: "rgba(134, 239, 172, 1)",
                    400: "rgba(74, 222, 128, 1)",
                    500: "rgba(34, 197, 94, 1)",
                    600: "rgba(22, 163, 74, 1)",
                    700: "rgba(21, 128, 61, 1)",
                    800: "rgba(22, 101, 52, 1)",
                    900: "rgba(20, 83, 45, 1)",
                },
                // アクセントカラー
                accent: {
                    // 警告・注意（オレンジ系）
                    warning: {
                        50: "rgba(255, 247, 237, 1)",
                        100: "rgba(255, 237, 213, 1)",
                        200: "rgba(254, 215, 170, 1)",
                        300: "rgba(253, 186, 116, 1)",
                        400: "rgba(251, 146, 60, 1)",
                        500: "rgba(249, 115, 22, 1)",
                        600: "rgba(234, 88, 12, 1)",
                        700: "rgba(194, 65, 12, 1)",
                        800: "rgba(154, 52, 18, 1)",
                        900: "rgba(124, 45, 18, 1)",
                    },
                    // エラー・緊急（赤系）
                    error: {
                        50: "rgba(254, 242, 242, 1)",
                        100: "rgba(254, 226, 226, 1)",
                        200: "rgba(254, 202, 202, 1)",
                        300: "rgba(252, 165, 165, 1)",
                        400: "rgba(248, 113, 113, 1)",
                        500: "rgba(239, 68, 68, 1)",
                        600: "rgba(220, 38, 38, 1)",
                        700: "rgba(185, 28, 28, 1)",
                        800: "rgba(153, 27, 27, 1)",
                        900: "rgba(127, 29, 29, 1)",
                    },
                    // 成功・完了（緑系）
                    success: {
                        50: "rgba(240, 253, 244, 1)",
                        100: "rgba(220, 252, 231, 1)",
                        200: "rgba(187, 247, 208, 1)",
                        300: "rgba(134, 239, 172, 1)",
                        400: "rgba(74, 222, 128, 1)",
                        500: "rgba(34, 197, 94, 1)",
                        600: "rgba(22, 163, 74, 1)",
                        700: "rgba(21, 128, 61, 1)",
                        800: "rgba(22, 101, 52, 1)",
                        900: "rgba(20, 83, 45, 1)",
                    },
                    // 情報（青系）
                    info: {
                        50: "rgba(240, 249, 255, 1)",
                        100: "rgba(224, 242, 254, 1)",
                        200: "rgba(186, 230, 253, 1)",
                        300: "rgba(125, 211, 252, 1)",
                        400: "rgba(56, 189, 248, 1)",
                        500: "rgba(14, 165, 233, 1)",
                        600: "rgba(2, 132, 199, 1)",
                        700: "rgba(3, 105, 161, 1)",
                        800: "rgba(7, 89, 133, 1)",
                        900: "rgba(12, 74, 110, 1)",
                    }
                },
                // グレースケール
                gray: {
                    50: "rgba(249, 250, 251, 1)",
                    100: "rgba(243, 244, 246, 1)",
                    200: "rgba(229, 231, 235, 1)",
                    300: "rgba(209, 213, 219, 1)",
                    400: "rgba(156, 163, 175, 1)",
                    500: "rgba(107, 114, 128, 1)",
                    600: "rgba(75, 85, 99, 1)",
                    700: "rgba(55, 65, 81, 1)",
                    800: "rgba(31, 41, 55, 1)",
                    900: "rgba(17, 24, 39, 1)",
                },
                // テキストカラー
                text: {
                    primary: "rgba(17, 24, 39, 1)",
                    secondary: "rgba(75, 85, 99, 1)",
                    tertiary: "rgba(107, 114, 128, 1)",
                    inverse: "rgba(255, 255, 255, 1)",
                    disabled: "rgba(156, 163, 175, 1)",
                },
                // 背景カラー
                background: {
                    primary: "rgba(255, 255, 255, 1)",
                    secondary: "rgba(249, 250, 251, 1)",
                    tertiary: "rgba(243, 244, 246, 1)",
                    overlay: "rgba(0, 0, 0, 0.5)",
                }
            }
        },
        // スペーシング
        spacing: {
            xs: "0.25rem",    // 4px
            sm: "0.5rem",     // 8px
            md: "0.75rem",    // 12px
            lg: "1rem",       // 16px
            xl: "1.25rem",    // 20px
            "2xl": "1.5rem",  // 24px
            "3xl": "2rem",    // 32px
            "4xl": "2.5rem",  // 40px
            "5xl": "3rem",    // 48px
            "6xl": "4rem",    // 64px
        },
        // ボーダー半径
        borderRadius: {
            none: "0",
            sm: "0.125rem",   // 2px
            md: "0.25rem",    // 4px
            lg: "0.5rem",     // 8px
            xl: "0.75rem",    // 12px
            "2xl": "1rem",    // 16px
            "3xl": "1.5rem",  // 24px
            full: "9999px",
        },
        // シャドウ
        boxShadow: {
            sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
            md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
            xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
        },
        // フォントサイズ
        fontSize: {
            xs: "0.75rem",    // 12px
            sm: "0.875rem",   // 14px
            base: "1rem",     // 16px
            lg: "1.125rem",   // 18px
            xl: "1.25rem",    // 20px
            "2xl": "1.5rem",  // 24px
            "3xl": "1.875rem", // 30px
            "4xl": "2.25rem", // 36px
            "5xl": "3rem",    // 48px
        },
        // フォントウェイト
        fontWeight: {
            thin: "100",
            light: "300",
            normal: "400",
            medium: "500",
            semibold: "600",
            bold: "700",
            extrabold: "800",
            black: "900",
        },
        // 行間
        lineHeight: {
            none: "1",
            tight: "1.25",
            snug: "1.375",
            normal: "1.5",
            relaxed: "1.625",
            loose: "2",
        },
        // Z-index
        zIndex: {
            auto: "auto",
            0: "0",
            10: "10",
            20: "20",
            30: "30",
            40: "40",
            50: "50",
            modal: "1000",
            popover: "1010",
            tooltip: "1020",
            notification: "1030",
        }
    },
    // レスポンシブブレークポイント
    breakpoints: {
        xs: 0,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536,
    },
    // アニメーション
    animations: {
        'fade-in': {
            from: { opacity: '0' },
            to: { opacity: '1' }
        },
        'fade-out': {
            from: { opacity: '1' },
            to: { opacity: '0' }
        },
        'slide-in-right': {
            from: { transform: 'translateX(100%)' },
            to: { transform: 'translateX(0)' }
        },
        'slide-out-right': {
            from: { transform: 'translateX(0)' },
            to: { transform: 'translateX(100%)' }
        },
        'scale-in': {
            from: { transform: 'scale(0.95)', opacity: '0' },
            to: { transform: 'scale(1)', opacity: '1' }
        },
        'scale-out': {
            from: { transform: 'scale(1)', opacity: '1' },
            to: { transform: 'scale(0.95)', opacity: '0' }
        }
    }
} as Config