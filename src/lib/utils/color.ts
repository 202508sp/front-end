type Color = {
    bg: string;
    primary: string;
    secondary: string;
    tertiary: string;
    text: string;
    accent: {
        pink: string;
        green: string;
    };
};

const color: Color = {
    bg: "rgba(242, 237, 230, 1)",
    primary: "rgba(231, 221, 207, 1)",
    secondary: "rgba(214, 198, 171, 1)",
    tertiary: "rgba(134, 106, 80, 1)",
    text: "rgba(81, 62, 62, 1)",
    accent: {
        pink: "rgba(254, 186, 170, 1)",
        green: "rgba(163, 209, 159, 1)",
    }
}

export { type Color, color as defaultColor };
