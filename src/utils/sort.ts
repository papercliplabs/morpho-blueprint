function sortTableAssetAmount(
  balanceA: number,
  balanceAUsd: number | undefined | null,
  balanceB: number,
  balanceBUsd: number | undefined | null
) {
  console.log(balanceA, balanceAUsd, balanceB, balanceBUsd);
  const aHasUsd = balanceAUsd && balanceAUsd > 0;
  const bHasUsd = balanceBUsd && balanceBUsd > 0;

  if (aHasUsd && !bHasUsd) {
    return 1;
  }

  if (!aHasUsd && bHasUsd) {
    return -1;
  }

  if (aHasUsd && bHasUsd) {
    return balanceAUsd - balanceBUsd;
  }

  return balanceA - balanceB;
}

export { sortTableAssetAmount };
