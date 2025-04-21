const drawProgressBar = (progress: Number) => {
    const barWidth = 30;
    const filledWidth = Math.floor(Number(progress) / 100 * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const progressBar = '+'.repeat(filledWidth) + '-'.repeat(emptyWidth);
    return `[${progressBar}] ${progress}%`;
}

export default drawProgressBar;