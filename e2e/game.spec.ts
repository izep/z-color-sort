import { test, expect } from '@playwright/test';

test.describe('Color Sort Game E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto('/');
  });

  test('should render the initial game layout and controls', async ({ page }) => {
    await expect(page.locator('h1')).toHaveText('🎨 Color Sort');
    await expect(page.locator('.game-stats')).toContainText('Moves: 0');

    // Default Medium difficulty has 5 colors -> 7 tubes (5 filled + 2 empty)
    const tubes = page.locator('.tube');
    await expect(tubes).toHaveCount(7);

    // Verify control buttons
    await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Undo' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Restart' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Get hint' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'New Game' })).toBeVisible();
    await expect(page.getByTitle('Toggle sound effects')).toContainText('Sound ON');
    await expect(page.getByTitle('Toggle colorblind accessibility mode')).toContainText('Patterns OFF');
  });

  test('should handle tube selection and deselection', async ({ page }) => {
    const tubes = page.locator('.tube');

    // Empty tube (tube 6) cannot be selected first
    const emptyTube = tubes.nth(5);
    await emptyTube.click();
    await expect(emptyTube).not.toHaveClass(/selected/);

    // Filled tube (tube 1) can be selected
    const filledTube = tubes.first();
    await filledTube.click();
    await expect(filledTube).toHaveClass(/selected/);
    await expect(filledTube).toHaveAttribute('aria-pressed', 'true');

    // Clicking again deselects it
    await filledTube.click();
    await expect(filledTube).not.toHaveClass(/selected/);
    await expect(filledTube).toHaveAttribute('aria-pressed', 'false');
  });

  test('should execute a pour into an empty tube and update move count', async ({ page }) => {
    const tubes = page.locator('.tube');
    const sourceTube = tubes.nth(0);
    const targetTube = tubes.nth(5); // empty tube

    // Select source tube
    await sourceTube.click();
    await expect(sourceTube).toHaveClass(/selected/);

    // Click empty tube to pour
    await targetTube.click();

    // Verify pouring animation starts
    await expect(sourceTube).toHaveClass(/pouring/);

    // Wait for the animation to finish and state to update
    await expect(page.locator('.game-stats')).toContainText('Moves: 1', { timeout: 3000 });
    await expect(sourceTube).not.toHaveClass(/pouring/);

    // Undo button should now be enabled
    const undoButton = page.getByRole('button', { name: 'Undo' });
    await expect(undoButton).toBeEnabled();

    // Target tube should now have colors
    const targetFilledSlots = targetTube.locator('.color-slot.filled');
    expect(await targetFilledSlots.count()).toBeGreaterThan(0);
  });

  test('should undo and restart moves correctly', async ({ page }) => {
    const tubes = page.locator('.tube');
    const sourceTube = tubes.nth(0);
    const targetTube = tubes.nth(5);

    // Make a move
    await sourceTube.click();
    await targetTube.click();
    await expect(page.locator('.game-stats')).toContainText('Moves: 1', { timeout: 3000 });

    // Click Undo
    const undoButton = page.getByRole('button', { name: 'Undo' });
    await undoButton.click();

    // Moves should revert to 0 and Undo should disable
    await expect(page.locator('.game-stats')).toContainText('Moves: 0');
    await expect(undoButton).toBeDisabled();

    // Make another move and test Restart
    await sourceTube.click();
    await targetTube.click();
    await expect(page.locator('.game-stats')).toContainText('Moves: 1', { timeout: 3000 });

    const restartButton = page.getByRole('button', { name: 'Restart' });
    await restartButton.click();

    await expect(page.locator('.game-stats')).toContainText('Moves: 0');
    await expect(undoButton).toBeDisabled();
  });

  test('should display hints with pulsing indicators and alert banner', async ({ page }) => {
    const hintButton = page.getByRole('button', { name: 'Get hint' });
    await hintButton.click();

    // Hint banner should appear
    const hintBanner = page.locator('.hint-banner');
    await expect(hintBanner).toBeVisible();
    await expect(hintBanner).toContainText('Hint: Pour Tube');

    // Hint source and target tubes should have animation classes
    await expect(page.locator('.tube.hint-source')).toBeVisible();
    await expect(page.locator('.tube.hint-target')).toBeVisible();
  });

  test('should toggle sound and colorblind patterns mode', async ({ page }) => {
    // Sound toggle
    const soundButton = page.getByTitle('Toggle sound effects');
    await soundButton.click();
    await expect(soundButton).toContainText('Sound OFF');
    await soundButton.click();
    await expect(soundButton).toContainText('Sound ON');

    // Colorblind toggle
    const colorblindButton = page.getByTitle('Toggle colorblind accessibility mode');
    await colorblindButton.click();
    await expect(colorblindButton).toContainText('Patterns ON');

    // Color labels (R, G, B, etc.) should be rendered
    const colorLabels = page.locator('.color-label');
    expect(await colorLabels.count()).toBeGreaterThan(0);

    // Toggle back
    await colorblindButton.click();
    await expect(colorblindButton).toContainText('Patterns OFF');
  });

  test('should switch difficulty levels and scale tube count', async ({ page }) => {
    // Easy (4 colors -> 6 tubes)
    await page.getByRole('button', { name: 'Easy' }).click();
    await expect(page.locator('.tube')).toHaveCount(6);

    // Hard (6 colors -> 8 tubes)
    await page.getByRole('button', { name: 'Hard' }).click();
    await expect(page.locator('.tube')).toHaveCount(8);

    // Expert (7 colors -> 9 tubes, 5 slots each)
    await page.getByRole('button', { name: 'Expert' }).click();
    const tubes = page.locator('.tube');
    await expect(tubes).toHaveCount(9);

    // Verify 5 slots capacity in expert
    const firstTubeSlots = tubes.first().locator('.color-slot');
    await expect(firstTubeSlots).toHaveCount(5);
  });

  test('should support keyboard navigation (Tab & Enter)', async ({ page }) => {
    // Focus the first tube using Tab
    await page.keyboard.press('Tab');
    
    // Press Enter to select the focused tube
    await page.keyboard.press('Enter');

    const selectedTube = page.locator('.tube.selected');
    await expect(selectedTube).toBeVisible();

    // Press keyboard shortcut 'r' to restart
    await page.keyboard.press('r');
    await expect(page.locator('.tube.selected')).toHaveCount(0);
  });
});
